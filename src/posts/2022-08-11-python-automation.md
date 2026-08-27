---
title: 把两小时的重复劳动消灭掉
date: 2022-08-11
tags: [技术, Python]
excerpt: 每周整理同一份报告，手动操作，两小时。第四周的时候我没有继续做，而是打开编辑器，写了一个脚本。
---

有一件事我花了三周才做，本来第一周就应该做。

那段时间每周要出一份数据报告：从三个不同的内部系统各导出一份 CSV，用 Excel 手动合并，按照固定的格式整理，发给对应的几个人。

第一周，我老老实实做完了，两个小时，感觉也还好。第二周，又做了一遍，两个小时，开始有点烦躁。第三周，坐下来准备开始做，突然停住了，想：我在做的这件事，每一步都是固定的，每一次的操作都是一样的，我只是在重复执行一套流程，换个人或者换一个程序来执行，结果是完全相同的。

**重复做同样的事超过三次，就应该考虑能不能让它自动化。这不是懒，是工程素养的一部分。**

我把 CSV 放在一边，打开 VS Code，写了一个 Python 脚本。

---

## 脚本的核心

那几个内部系统都有 API，只是之前我一直在用浏览器导出 CSV 文件，没想过直接调 API。

核心逻辑其实不复杂：

```python
import requests
import pandas as pd
from datetime import datetime, timedelta

def fetch_data(system_config, date_range):
    start, end = date_range
    resp = requests.get(
        f"{system_config['base_url']}/api/export",
        params={"start_date": start, "end_date": end},
        headers={"Authorization": f"Bearer {system_config['token']}"},
        timeout=30
    )
    resp.raise_for_status()
    return pd.DataFrame(resp.json()["records"])

def build_report(all_dfs):
    merged = pd.concat(all_dfs, ignore_index=True)
    merged["date"] = pd.to_datetime(merged["date"])
    merged = merged.sort_values(["date", "category"])
    summary = merged.groupby("category").agg(
        total=("amount", "sum"),
        count=("id", "nunique"),
        avg=("amount", "mean")
    ).round(2).reset_index()
    return summary
```

加上配置文件读取、异常处理、日志输出、邮件发送，整个脚本大概 180 行。

第一次跑通的时候，终端输出了一行"报告已生成并发送"，我盯着屏幕发了几秒呆。

之前两小时做的事，脚本跑了不到三分钟。我需要做的，只是确认一下输出格式正不正确。

## Python 在我技术栈里的位置

我主力语言是 Java，用了几年，不打算换。但 Python 开始占据我工具箱里一个固定的位置，负责做 Java 不适合做的事。

Java 适合构建系统——类型系统严格，编译期发现问题，生态成熟，长期维护成本低。但写一个临时的数据处理脚本，或者快速验证一个想法，Java 的冷启动成本太高：需要建项目、写类、写 main 方法、打包……写脚本这件事本身就是追求快，Java 的仪式感在这里是负担。

Python 写脚本非常顺畅，`pandas` 处理表格数据、`requests` 调 HTTP、`schedule` 做定时任务，大多数需求十几行就能完成，不需要任何框架，直接跑就是。

不是要在 Python 和 Java 之间分胜负，而是**不同的工具有不同的适用场景，能识别这件事，比精通一门语言更重要**。

## 监控是自动化的下半部分

脚本部署上去之后，有一次 A 系统改了 API 的响应格式，脚本解析失败，当周报告没发出去。

我是收到邮件问"本周报告怎么没收到"才知道脚本挂了的。

那次之后加了监控：脚本每次执行完，不管成功还是失败，都发一条通知——成功了说输出了多少条记录，失败了附上错误信息和堆栈。

**自动化了一件事，同时要自动化对它的监控。没有监控的自动化脚本，是定时炸弹。**

这个道理看起来很简单，但需要自己踩一次才会真正记住。

## 边界在哪里

写完这个脚本之后，我陆续自动化了几件事：开发环境的搭建、测试数据的准备、日志的定期清理、服务器健康状态的巡检。

但有一类事情我刻意没有自动化：需要判断的事情。

报告格式对不对、数据里有没有异常波动、某个指标的趋势是否正常——这些我留着自己看，不用脚本代替。不是因为技术上做不到，而是因为这些判断需要上下文，需要你对业务的理解，自动化之后你会慢慢失去这种感知。

有些事情保留手工，不是在浪费时间，是在维持一种对系统的触感。

---

那个报告脚本现在还在跑，每周准时发出去，没有人注意到它的存在，也没有人需要注意到它。

一个好的自动化工具就应该这样——安静地运行在某个地方，不打扰任何人，把该做的事做好，然后等下一次被需要。

有时候我觉得，这也是我对自己的期望之一。
