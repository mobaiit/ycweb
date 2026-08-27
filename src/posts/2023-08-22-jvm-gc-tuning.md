---
title: JVM 调优：一次生产环境 GC 风暴的排查
date: 2023-08-22
tags: [技术, Java]
excerpt: 服务每隔几小时就会有一次明显的响应延迟，监控图上是规律性的尖刺。排查了两天，最后是 GC 的问题。
---

## 异常的响应延迟

八月中旬，收到告警：某个服务每隔三到四小时，P99 响应时间会突然从 200ms 飙升到 3000ms，持续约一分钟后恢复正常。

规律性的尖刺，说明不是偶发的流量波动，而是某种周期性的内部行为。

第一反应：GC。

## 确认问题

加上 JVM 参数，输出 GC 日志：

```
-Xlog:gc*:file=/var/log/app/gc.log:time,uptime:filecount=5,filesize=20m
```

重启服务，等了四小时，看日志：

```
[4h03m12s] GC(1523) Pause Full (Ergonomics) 3820M->1245M(4096M) 54321ms
```

`Pause Full`，全停顿 GC，持续 **54 秒**。54 秒内所有线程全部停止，请求全部积压。就是这个导致的延迟尖刺。

## 为什么会触发 Full GC

Full GC 触发的常见原因：老年代空间不足。

看 GC 日志前后的内存变化：Full GC 前老年代占用约 3.8G，GC 后降到 1.2G。说明有大量对象在老年代堆积，直到撑满才触发 Full GC。

用 jmap 抓堆快照：

```bash
jmap -dump:format=b,file=heap.hprof <pid>
```

用 Eclipse MAT 分析，发现一个 `Map<String, List<Object>>`，持有了大量历史数据，没有被释放。

翻代码，找到了：一个本地缓存，设计上是缓存最近的查询结果，但**没有设置最大容量和过期时间**，随着时间推移无限增长，直到把老年代填满。

## 修复

两步修复：

**第一步：修改缓存实现**，用 Guava Cache 替换手写的 Map，设置最大条目数和过期时间：

```java
Cache<String, List<Object>> cache = CacheBuilder.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(30, TimeUnit.MINUTES)
    .build();
```

**第二步：调整 JVM 参数**，增大新生代比例，减少对象晋升到老年代的速度：

```
-Xms4g -Xmx4g
-XX:NewRatio=2
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
```

换成 G1 GC，设置最大停顿目标 200ms，G1 会自动调整 GC 节奏来满足这个目标。

上线后观察一周，Full GC 消失，响应时间稳定在 150ms 以内。

## 教训

**1. 本地缓存必须有边界。** 没有边界的缓存是内存泄漏的另一种写法。

**2. JVM 监控要常态化。** 这次问题存在了可能很久，一直没有被发现，因为没有针对 GC 的告警。现在加上了 Full GC 次数、GC 停顿时间的监控指标。

**3. 理解 JVM 内存模型是基础。** 不理解新生代/老年代/GC 触发条件，遇到这类问题只能瞎猜。这些东西值得花时间深入理解。

GC 日志不会说谎。

运行。
