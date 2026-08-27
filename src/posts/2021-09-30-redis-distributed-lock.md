---
title: Redis 分布式锁踩坑实录
date: 2021-09-30
tags: [技术, Java, 微服务]
excerpt: 这些坑不踩一遍，你永远不知道它有多深。用了三个月才彻底搞清楚分布式锁的正确姿势，代价是一次线上事故。
---

那是个周三下午，线上突然出现库存超卖的告警。

同一个商品，库存明明只剩 1，却成功创建了 3 个订单。数据库里出现了负数库存。客服那边炸了，电话一直打进来，产品经理站在我工位旁边没走，运营在钉钉群里连发消息。

那种时刻非常难受。不是因为被人催，而是因为你知道问题在代码里，但找不到在哪里，每一秒都在继续损失。

排查了大概两小时，最后定位到：分布式锁的实现有问题。

---

那个分布式锁是我写的，用的是最朴素的方案：`SETNX` 加上 `EXPIRE`。

```java
boolean locked = redisTemplate.opsForValue().setIfAbsent(key, "1");
if (locked) {
    redisTemplate.expire(key, 30, TimeUnit.SECONDS);
    try {
        // 扣减库存
        doDeductStock();
    } finally {
        redisTemplate.delete(key);
    }
}
```

写完之后我还挺满意的：加锁、设过期时间、业务逻辑、释放锁，逻辑清晰，没问题。

问题在哪里？`setIfAbsent` 和 `expire` 是两个独立的命令。如果程序在加锁成功之后、设置过期时间之前崩溃或者重启，这个 key 会永远留在 Redis 里，后续所有请求都加锁失败，直到有人手动去删这个 key。死锁。

更要命的是：即使没有崩溃，如果加锁和设过期之间有一个短暂的时间窗口，这个窗口里出现了高并发，多个请求可能都通过了 `setIfAbsent`，因为时序上它们都在 `expire` 之前。

这就是超卖的根本原因。

## 修一：原子性

把两个命令合成一个：

```java
Boolean locked = redisTemplate.opsForValue()
    .setIfAbsent(key, requestId, 30, TimeUnit.SECONDS);
```

Redis 2.6.12 之后，SET 命令支持 NX 和 PX 参数，在一个原子操作里完成"如果不存在就设置，同时设置过期时间"。Java 客户端这个重载方法底层用的就是这条命令。

加锁变成了真正的原子操作，不存在两个命令之间的时间窗口。

## 修二：别人的锁不能随便删

解决了原子性之后，还有另一个问题，更隐蔽一点。

场景：线程 A 加锁成功，持有锁执行业务逻辑。但业务逻辑执行时间比较长，锁的过期时间到了，Redis 自动把锁删掉了。线程 B 在这时候加锁成功，开始执行。然后线程 A 业务逻辑执行完了，去释放锁，调了 `delete(key)`，把线程 B 的锁给删了。线程 C 此刻加锁成功……

这个场景下，锁彻底失效，多个线程同时在跑业务逻辑。

解决方案：加锁的时候存入一个唯一标识（UUID），释放锁的时候先检查这个 key 的值是不是当前线程设置的，是才删，不是就不动。

但 check-then-delete 这两步也不是原子的，需要用 Lua 脚本：

```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end
```

Lua 脚本在 Redis 里是原子执行的，中间不会被其他命令插入。

## 修三：续期

还有一个问题没有解决：锁的过期时间怎么设合适？

设短了，业务逻辑还没完成，锁就过期了（上面那个问题的根源）。设长了，如果程序在持有锁期间崩溃，锁要等很久才会释放，其他请求一直等。

理想的方案是：持有锁的期间，如果业务逻辑还没完成，自动续期；业务完成了，立刻释放。

这就是 Redisson 的 Watchdog 机制做的事。用 Redisson：

```java
RLock lock = redissonClient.getLock("inventory:lock:" + productId);
try {
    if (lock.tryLock(5, 30, TimeUnit.SECONDS)) {
        doDeductStock();
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

Redisson 在获取锁之后，启动一个后台线程（看门狗），每隔 10 秒检查一次锁是否还被持有，如果是就延长过期时间。业务完成，显式 unlock，看门狗停掉，锁释放。

## 更深的坑：主从切换

用了 Redisson 的普通锁之后，还有一个更底层的问题：Redis 主从切换。

主节点加了锁，还没来得及同步到从节点，主节点挂了。从节点提升为主节点，上面没有这个 key，另一个线程在新主节点加锁成功，这时候两个线程同时持有锁。

这是 CAP 权衡的问题，Redis 主从方案在这个场景下无法保证强一致性。

追求极致一致性的话，用 RedLock 算法：同时向多个独立 Redis 节点发起加锁请求，超过半数成功才认为加锁成功。但 RedLock 本身也有争议，Antirez 和 Martin Kleppmann 当年那场公开讨论很值得一读。

大多数业务场景，Redisson 普通锁已经足够。

---

那次线上事故改完上线之后，我在技术日志里写了这些踩坑记录。

有时候觉得，工程能力里很重要的一部分，不是在顺利的时候能做得多好，而是在出了问题的时候，能多快找到根本原因，改完之后能保证同样的问题不再发生。

那个周三的下午，很难熬。但那天之后，我对分布式锁这件事理解得比看任何文档都要透彻。

有些东西不经过手，进不了身体里。
