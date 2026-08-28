---
title: MCP 协议：给 AI 装上真正的手
date: 2025-04-27
tags: [技术, AI Agent, Python]
excerpt: Model Context Protocol 是 Anthropic 去年底提出的。花了几天把它搞透，觉得这是 AI 工具集成领域目前最清晰的一个方案。
---

做 AI Agent 做了将近两年，遇到过的最大工程问题之一是工具集成的混乱。

每个 Agent 框架都有自己的工具定义方式，每个工具都需要为特定框架写特定的接口，换一个框架，工具全部要重写。LangChain 的工具定义和 AutoGen 的不兼容，AutoGen 的和 CrewAI 的又不一样，整个生态是碎片化的，没有一个大家都认的标准。

四月份，我认真研究了 MCP（Model Context Protocol），Anthropic 在去年底提出的开放协议。花了几天把文档和示例跑通，觉得这是目前见过的对这个问题最清晰的回答。

---

## 问题是什么

在 MCP 之前，给 LLM 连接外部工具的方式是这样的：

开发者为每个工具写一个函数，在 prompt 里描述工具的功能和参数，LLM 决定调用哪个工具，生成符合格式的调用请求，你解析这个请求，调用函数，把结果返回给 LLM，LLM 继续生成回答。

这个流程本身没问题，但在每个框架里的实现方式都不一样，没有标准化。结果是：一个有用的工具，想让它在不同的 Agent 框架里都能用，需要针对每个框架写一版适配，维护成本很高；换框架的成本巨大，因为所有工具都需要重写。

MCP 想解决的就是这个：**用一个标准协议定义工具，框架负责按协议调用，工具只需要实现一次。**

## MCP 的架构

MCP 是一个 Client-Server 架构。

MCP Server 是工具提供方：定义可用的工具（tools）、可访问的资源（resources）、可填充的提示词（prompts），对外暴露一个标准接口。

MCP Client 是工具消费方，通常是 AI 应用或者 Agent 框架：连接到 Server，发现有哪些工具可用，在需要的时候调用工具，接收结果。

中间的通信协议是标准化的 JSON-RPC，通过 stdio 或者 HTTP+SSE 传输。

写一个最简单的 MCP Server，Python 实现：

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import subprocess

app = Server("code-runner")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="run_python",
            description="在沙盒环境中运行 Python 代码，返回输出结果",
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "要执行的 Python 代码"
                    }
                },
                "required": ["code"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "run_python":
        code = arguments["code"]
        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout or result.stderr
        return [TextContent(type="text", text=output)]

async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

这个 Server 对外暴露了一个 `run_python` 工具。任何支持 MCP 的客户端——Claude Desktop、Cursor、自己写的 Agent——都可以连上来，发现这个工具，在需要的时候调用它。

工具只写一次，到处能用。

## 和之前的方式比

用 LangChain 定义同样的工具：

```python
from langchain.tools import tool

@tool
def run_python(code: str) -> str:
    """在沙盒环境中运行 Python 代码"""
    result = subprocess.run(["python", "-c", code], ...)
    return result.stdout
```

代码量差不多，但这个工具只能在 LangChain 里用。如果你换了 AutoGen，这段代码没有任何价值，要重写一版 AutoGen 的 tool 接口。

MCP 的 Server 写完，不管底层 Agent 框架换成什么，只要框架支持 MCP 协议，就能用。

协议的价值不在于它让单个工具变得更好，而在于它让生态变得更好。标准化之后，工具可以被复用，可以被分享，可以被组合，整个生态的工具库开始积累。

## 我在用的几个场景

把几个常用的内部工具包装成了 MCP Server，在不同的 Agent 里复用：

**代码仓库工具**：读取指定仓库的文件结构、读取文件内容、搜索代码。做代码 Review Agent 的时候用到。

**知识库查询工具**：封装了向量数据库的查询接口，输入问题，返回相关文档片段。做问答 Agent 的时候用到。

**项目管理工具**：读取任务列表、更新任务状态。用于自动化一些项目管理的日常操作。

这三个 Server 写好之后，在任何新的 Agent 项目里都可以直接接进来，不需要重写。节省的不只是代码量，是每次都要重新思考"这个工具怎么接入这个框架"的认知成本。

## 还不完美的地方

标准化带来好处，也带来约束。

MCP 目前的 tool 定义是同步的，每次调用等结果。对于需要长时间运行的工具（比如执行一段需要几分钟的计算），这个模型不够用，需要额外的异步机制。

安全边界也需要自己管：MCP Server 对外暴露了工具调用能力，如果部署在网络可访问的地方，需要认真考虑认证和权限控制，不然是一个很大的攻击面。

生态还在早期，不是所有的 Agent 框架都完整支持 MCP，有些支持了但实现不完整，遇到边界情况需要自己处理。

---

四月底，把第一个完整的 MCP Server 部署上线，接入了正在用的 Agent 系统。

看着两个之前各自独立的工具，现在通过标准协议被同一个 Agent 统一调用，有一种工整的满足感。

技术世界里，混乱是默认状态，秩序是人为建立的。每一个被认可的标准，都是一群人在混乱里锚定了某个共识，然后往那个方向用力。

这件事，慢慢来，但终究会有结果的。
