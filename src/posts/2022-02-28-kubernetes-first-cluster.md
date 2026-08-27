---
title: 三台破虚拟机，和我的第一个 K8s 集群
date: 2022-02-28
tags: [技术, Kubernetes, Docker]
excerpt: 用三台 2 核 4G 的虚拟机搭了第一个 K8s 集群。过程比想象中痛苦，但搭完之后很多之前只是"知道"的概念忽然活了。
---

学 K8s 有一段时间了，看了不少文档和视频，概念都能说出来：Pod、Deployment、Service、ConfigMap、Ingress……但一直有一种隔着玻璃的感觉——知道它们是什么，但说不清楚它们是怎么协作的，出了问题不知道从哪里排查。

这种状态让我不舒服。知道和理解之间有一条沟，只有自己把东西搭起来，才能真正跨过去。

春节假期，我用 VirtualBox 开了三台虚拟机：一台 master，两台 node，每台 2 核 4G，Ubuntu 20.04。目标是用 kubeadm 搭一个可以用的集群，把之前用 Docker Compose 跑的几个服务迁移过来。

---

## 踩坑记录

`kubeadm init` 没有一次跑通过。

第一个报错：

```
[ERROR Swap]: running with swap on is not supported. Please disable swap
```

K8s 不支持开启 swap，原因是 swap 会让内存管理变得不可预测，影响容器调度的准确性。关掉 swap：

```bash
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
```

第二个报错，cgroup driver 不匹配。Docker 默认用 cgroupfs，kubeadm 要求用 systemd。改 Docker 配置，加一行：

```json
{ "exec-opts": ["native.cgroupdriver=systemd"] }
```

重启 Docker，再跑 `kubeadm init`，这次能走到最后了。但 node 加入集群之后，`kubectl get nodes` 看到状态是 `NotReady`，不管等多久都不变。

查了半天，原因是没有安装网络插件。K8s 本身不包含网络实现，需要第三方 CNI 插件——我选了 Calico，按文档一步步装完，node 状态变成了 `Ready`。

整个初始化过程踩了大概六七个坑，前后折腾了将近一天。

但等到 `kubectl get nodes` 输出三行 `Ready` 的时候：

```
NAME         STATUS   ROLES           AGE
k8s-master   Ready    control-plane   52m
k8s-node1    Ready    <none>          48m
k8s-node2    Ready    <none>          47m
```

我盯着这三行字看了好一会儿。

## 声明式是 K8s 的灵魂

把第一个服务迁移到 K8s 的时候，我才真正理解声明式（Declarative）是什么意思。

Docker Compose 的方式是命令式的：告诉系统"现在启动这个容器，映射这个端口，挂载这个目录"。你在描述操作步骤。

K8s 的方式是声明式的：你写一个 YAML，描述期望状态——"我要有三个这个镜像的副本在跑，对外暴露这个端口，配置从这个 ConfigMap 读"。然后提交给集群，告诉它"帮我达到这个状态"。

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-service
  template:
    spec:
      containers:
      - name: my-service
        image: my-service:v1.2.0
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

提交之后，K8s 的控制器会不断地把实际状态往期望状态上拉。如果一个 Pod 挂了，控制器发现实际副本数少于期望的 3，自动拉起一个新的。如果一台 Node 宕了，上面的 Pod 被调度到其他 Node 重新启动。

这个"永无休止的调谐"（Reconcile Loop）是 K8s 自愈能力的核心。你不需要写脚本监控服务是否存活、不需要手动重启挂掉的进程，你只需要声明期望，剩下的交给系统。

## 我们通常低估了"操作步骤"的脆弱性

理解声明式之后，我对之前写的很多运维脚本有了新的认识。

那些脚本基本上都是一长串命令：先做这个，然后做那个，出错了 exit，成功了继续。问题是：如果脚本在第五步挂了，系统处于一个"部分完成"的中间状态，下次重新跑脚本可能会因为环境状态不对而出更奇怪的错误。

命令式操作假设从起点到终点是一条直线，但实际环境经常不是直线。

声明式操作假设系统可能处于任何状态，你只告诉它目标，它自己想办法到达。这种设计天然对中间状态有容错性。

这个思路影响了我后来对很多系统设计问题的判断。能用声明式描述的地方，尽量不用命令式，虽然声明式往往实现起来更复杂，但长期的可维护性和可靠性要好得多。

## 资源限制的重要性

有一次，一个测试服务的内存占用失控，把整台 Node 的内存撑满了，导致同一台 Node 上的其他 Pod 被 OOM Kill。

那次之后我养成了一个习惯：所有 Pod 都设置 `resources.requests` 和 `resources.limits`。

`requests` 告诉调度器这个 Pod 需要多少资源，调度器根据这个决定放到哪台 Node 上；`limits` 是硬上限，超出了就被 kill 掉，不允许影响邻居。

这是一种边界意识——每个单元清楚自己的边界，不能无限制地消耗公共资源，哪怕是在自己正常运行的情况下。

---

那个春节假期过完，三台虚拟机还在跑，上面跑着几个服务，每天启动电脑都能看到 `kubectl get pods` 输出的绿色 Running 状态。

学东西有时候就是这样，文字和概念可以积累很久，但真正的理解往往在某一次动手的过程里突然到来——不是渐进的，是忽然对上了。

那种对上的感觉，比任何文档里的 "AHA moment" 都要真实。
