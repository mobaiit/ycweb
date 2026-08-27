---
title: API 网关：所有请求都经过这扇门
date: 2021-01-22
tags: [技术, 微服务, Spring Cloud]
excerpt: 网关不只是路由，它是整个系统安全边界和流量策略的执行者。理解它，要先理解为什么需要它。
---

刚开始做微服务的时候，我犯了一个很典型的错误：每个服务直接对外暴露端口。

用户服务 8081，订单服务 8082，库存服务 8083，通知服务 8084。客户端想调哪个服务，就直接请求哪个地址。我当时觉得这很直接，没什么问题。

然后问题来了。

前端同学问我："你们服务端的地址为什么有四个？我要在哪个时候调哪个？"

我解释了一遍，他记下来了。过了两周，用户服务的端口换了，他说："你这接口怎么突然不通了？"我想起来改过端口，告诉他新地址，他重新配置，继续工作。

但这只是个内部项目，如果是对外的产品，客户端已经集成了你的地址，你改一次端口意味着对方需要跟着改，这在很多情况下是不可能的。

更深的问题还没来：认证逻辑写在哪里？每个服务都要写一遍 JWT 校验吗？限流写在哪里？日志追踪怎么统一？

这些问题堆在一起，把我推向了一个结论：需要一个统一的入口。

## 网关是什么

Spring Cloud Gateway 文档里有一句话，我觉得很准确：网关是所有外部请求的单一入口。

单一入口意味着什么——客户端不需要知道后面有多少个服务，不需要知道每个服务在哪里。它只需要知道一个地址，告诉网关"我要什么"，网关决定把请求转发到哪个服务，拿到结果，返回给客户端。

对外是一个面，对内是一套复杂的路由、过滤、负载均衡逻辑。

网关的三个核心概念：Route（路由规则）、Predicate（匹配条件）、Filter（过滤器）。

Route 定义了请求从哪里来、转发到哪里去。Predicate 定义了什么请求符合这条路由规则——可以按路径、Header、请求参数、时间范围匹配。Filter 是真正做事情的地方：认证、限流、日志、请求改写、响应修改，全在这里。

配置看起来很直观：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/order/**
          filters:
            - StripPrefix=1
```

`lb://order-service` 里那个 `lb` 是 load balancer 的缩写，意思是从注册中心找到 order-service 的实例，自动负载均衡。不写死 IP，服务地址变了也不需要改网关配置。

## 认证移到网关层

之前每个服务都有一堆 JWT 校验的代码，复制粘贴了四五遍，改起来要改好几个地方。

把认证逻辑提到网关层，下游服务就彻底不需要关心"这个请求是谁发的、有没有权限"这件事了。

全局过滤器实现起来不复杂，核心逻辑就是：拦截所有请求，取 Authorization Header，校验 token，合法就把解析出来的用户信息附加到 Header 里转发给下游，不合法直接返回 401。

```java
@Component
public class AuthFilter implements GlobalFilter, Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest()
            .getHeaders().getFirst("Authorization");
        if (!isValid(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        String userId = extractUserId(token);
        ServerHttpRequest req = exchange.getRequest().mutate()
            .header("X-User-Id", userId).build();
        return chain.filter(exchange.mutate().request(req).build());
    }

    @Override
    public int getOrder() { return -100; }
}
```

下游服务从 Header 里取 `X-User-Id` 就知道是谁的请求。认证逻辑只在一个地方维护，改了就全生效。

## 掉进 WebFlux 的坑

Gateway 基于 WebFlux 响应式框架，这是我踩的第一个坑。

我在 pom.xml 里同时引入了 `spring-boot-starter-web` 和 `spring-cloud-starter-gateway`，启动直接报错，说两者不兼容。

去掉 `spring-boot-starter-web` 之后能启动了，但之前写的一些 Servlet API 的代码全部编译报错，因为 WebFlux 的请求响应对象是另一套接口——`ServerWebExchange`、`ServerHttpRequest`、`Mono<Void>`，和传统的 `HttpServletRequest`/`HttpServletResponse` 完全不同。

响应式编程是另一套思维模型，不是把原来的代码改改就能用。我花了将近一周，把 Reactor 的基础概念——`Mono`、`Flux`、操作符链——认真看了一遍，才真正能写出能用的 Gateway 代码。

新东西要用，先搞清楚它的底层模型，不能只看着用法复制粘贴。这个教训之后遇到任何新框架都适用。

## 限流和熔断

限流用 Redis 令牌桶，配置几行 YAML 就能搞定：

```yaml
filters:
  - name: RequestRateLimiter
    args:
      redis-rate-limiter.replenishRate: 100
      redis-rate-limiter.burstCapacity: 200
      key-resolver: "#{@ipKeyResolver}"
```

按 IP 限流，每秒 100 个请求，最大突发 200。超过了直接返回 429，不透传到下游服务，下游服务的压力就稳了。

熔断集成 Resilience4j，某个下游服务响应太慢或者出错率太高，网关自动熔断，直接返回降级响应，不让请求继续堆积在那个服务上。

这两个机制加在一起，网关就不只是一个转发层，而是系统稳定性的第一道防线。

---

把网关搭完的那天晚上，我在 Postman 里一条一条测试路由规则，看着请求被正确地转发到各个服务，认证不通过的请求被正确地拦截在外面，有一种说不出来的满足感。

不是因为技术多难，而是因为这套东西把之前很多散乱的职责归拢到了一个地方，系统的边界变得清晰了。

每次架构变得更清晰一点，就像是房间里的东西被整理了一次，原来堆在角落的杂物有了自己的位置，走进来不会再被绊倒。
