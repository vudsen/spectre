## Why

当前 AI 会话在同一轮 LLM 返回多个 `tool_call` 时，后端只会顺序处理到第一个阻塞型工具并立即返回，导致后续工具调用丢失。恢复会话时，`chatMemory` 中记录的 `tool_call` 数量与实际补回的 `ToolResponseMessage` 数量不一致，最终会触发对话流程错误。

随着系统已经支持同一次对话加载多个技能，LLM 在单轮中发起多个工具调用会越来越常见。需要尽快补齐“整批挂起、整批恢复”的能力，避免 AI 工具链在涉及确认和人工回复时变得不稳定。

## What Changes

- 将单轮 assistant 返回的全部 `tool_call` 视为同一个待处理批次，在存在阻塞型工具时一次性发送给前端，而不是遇到第一个阻塞项就中断。
- 为每个工具调用引入稳定的 `toolCallId` 关联键，并为前端提供“等待执行”“等待确认”等批次内状态；`ask_human` 通过工具名识别为等待人工回复项。
- 调整前端 AI 消息展示与交互模型，使其可以同时展示多个确认框，并按顺序处理多个 `ask_human` 请求。
- 新增会话恢复时的结构化工具响应协议，前端在处理完整批次后按原始顺序一次性回传所有工具响应，后端再统一执行工具并恢复 LLM 调用。

## Capabilities

### New Capabilities

- `ai-multi-pending-tool-calls`: 规范 AI 会话在单轮多工具调用、阻塞挂起、前端批量确认与恢复执行场景下的行为。

### Modified Capabilities

无

## Impact

- 后端：`spectre-core` 中 `DefaultAiService`、`ChatMemoryUtil`、`AgentEventPublisher` 及相关 AI 工具执行链路。
- 前端：`spectre-frontend` 中频道 AI 消息流解析、工具卡片展示、确认/人工回复交互与恢复接口调用。
- 接口协议：SSE 工具事件结构与会话恢复请求体需要扩展为支持整批工具调用。
