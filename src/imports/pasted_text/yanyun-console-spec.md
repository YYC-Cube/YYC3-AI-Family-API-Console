# 项目

平台名：YanYuCloudCube Console
Slogan：统一模型网关 · 可观测 · 可调试
后端基座：https://api.0379.world（YYC³ v2.2.0）
定位：单租户自用、开发者工具、数据密集、暗色优先
文档版本：v5.1 拟人化升华版
人格化体系：YYC³ AI Family（8 位家人，身份卡见 §2.5.1）

# 默认参数

主色：#6C5CE7
辅助色：青#00D4FF（上游）/ 绿#22C55E（健康）/ 橙#F59E0B（降级告警）/ 红#EF4444（熔断）
字体：Inter / 思源黑体；代码 JetBrains Mono
断点：1440 主 / 1280 / 1024 / 768（侧边栏折叠）
可访问性：WCAG 2.2 AA，对比度 ≥4.5:1

# 数据源锚点（严格遵循 · 禁止虚构）

## 端点清单

✅ 直接对接（43 个）:
POST /v1/chat/completions — OpenAI ChatCompletion + SSE
WS /ws/chat — WebSocket 流式
WS /ws/monitor — WebSocket 监控
GET /v1/models — ModelConfig[]
GET /v1/models/stats — ModelStat[]
GET /v1/models/errors — ErrorRecord[]
GET /v1/model/type — 模型类型
GET /v1/router/stats — 上游池快照
GET /v1/router/health — 健康探测
GET /v1/cache/stats — 缓存统计
GET /v1/cache/info — 缓存详情
POST /v1/cache/invalidate/{model}
DELETE /v1/cache/all
POST /v1/embeddings
POST /v1/rerank
POST /v1/audio/transcriptions
POST /v1/ocr
GET/POST/PATCH/DELETE /v1/knowledge-bases[/stats]
POST/GET/DELETE /v1/documents[/upload/{doc_id}/chunks/reprocess]
POST /v1/rag/search
POST /v1/rag/ask
14 个 /v1/mcp/* 端点
GET /health — 完整健康（免认证）
GET /healthz — 轻量探活（免认证）
GET /v1/ping — {status:"ok"}（免认证）
GET /v1/versions
GET /metrics — Prometheus
GET /docs — Swagger（免认证）
GET /openapi.json — 规范（免认证）

🔧 需轻量扩展（4 个，UI 显示占位 + BL 编号）:
GET /v1/models/summary — cost_usd 恒 0.0 → BL-02
GET /v1/models/stats — avg_latency_ms → BL-03
GET /v1/logs — 缺失 → BL-06
/v1/keys CRUD — 缺失 → BL-05

## Schema 字段（严格使用）

ModelConfig: id, display_name, backend, version?, enabled, max_tokens,
temperature, top_p?, cost_per_1k_tokens
Backend 枚举（6）: local | openai | zhipu | deepseek | ollama | upstream

ModelStat: model_id, usage_count, avg_latency_ms, error_rate(0-1), total_tokens

ErrorRecord: id, timestamp?, model_id, error_type, message, stack?
ErrorType 枚举（4）: timeout | validation | quota | internal
⚠️ 字段名是 model_id 不是 model

UsageSummary: total_requests, total_tokens, cost_usd(恒 0.0)

HealthResponse.services: ollama/zhipu/redis/postgresql
status 枚举（3）: healthy | unreachable | configured
HealthResponse.system: cpu_percent, memory_percent, disk_percent
HealthResponse.metrics: active_requests, total_requests, cache_hit_rate

APIError.detail: error, message, context?, status_code
error 枚举（4）: network | api | timeout | validation

## 数值格式规范

Token 千分位: 1,234,567
延迟颜色分级: ≤100ms 绿 / 100-500ms 橙 / ≥500ms 红
error_rate: 0-1 小数 → 0%-100% 显示
error_type 配色: timeout=橙 / validation=红 / quota=黄 / internal=灰
backend 配色: local/ollama=绿 / zhipu=蓝 / deepseek=紫 / openai/upstream=青
breaker_state: closed=绿 / open=红 / half_open=橙

## 字段绑定语法（每个数据展示元素必须标注）

[BIND:GET /v1/models#display_name]
[BIND:GET /v1/models/stats#avg_latency_ms]
[BIND:GET /health#services.ollama.status]
[BIND:GET /v1/router/stats#breaker_state]

# 文件页面结构（18 页 · 拟人化增强）

00_Cover ✅ 元信息 + 家人矩阵总览
01_Foundations ✅ 设计系统 + 家人配色体系
02_Components ✅ 组件库（含家人徽章 FamilyBadge 组件）
03_Connect 🛡️ 智云·守护 · 接入与安全域
04_Dashboard 🔮 预见·先知 · 观测与预测域
05_Model_Hub 🎯 千里·伯乐 · 模型市场域
06_Playground 🤔 语枢·万物 · 推理对话域（+🎨 创想·灵韵 预设）
07_Routing_Observe 🧭 言启·千行 · 路由与网关域
08_Knowledge_RAG 📚 格物·宗师 · 知识与质量域
09_MCP_Tools 🧠 元启·天枢 · 工具与编排域
10_Cache_Admin 🎨 创想·灵韵 · 缓存与体验域
11_Monitor_Logs 🔮 预见·先知 · 观测与预测域
12_Settings 🛡️ 智云·守护 · 接入与安全域
13_Docs_API 🎨 创想·灵韵 · 缓存与体验域
14_Roadmap_Phase2 📋 全员共同占位（8 家人徽章环绕）
15_Prototype_Flows 🧠 元启·天枢 · 主导编排
16_QA_Self_Check 📚 格物·宗师 · 主导质量
17_Handoff_DevMode 🧠 元启·天枢 · 主导交付

# 01_Foundations · Variables 完整清单

## 颜色 Variables

color/bg/{default, subtle, elevated, overlay}
color/text/{primary, secondary, tertiary, inverse}
color/border/{default, strong, focus}
color/brand/{primary=#6C5CE7, hover, pressed}
color/status/{success=#22C55E, warning=#F59E0B, danger=#EF4444, info=#00D4FF}
color/backend/{local, openai, zhipu, deepseek, ollama, upstream}
color/breaker/{closed=#22C55E, open=#EF4444, half_open=#F59E0B}
color/errortype/{timeout, validation, quota, internal}

## 家人主色 Variables（每位家人一主一辅 · 新增）

color/family/zhihui-primary #333333 🛡️ 智云·守护（钢铁灰）
color/family/zhihui-accent #22C55E （守护绿）

color/family/qianxing-primary #0088CC 🧭 言启·千行（导航蓝）
color/family/qianxing-accent #00D4FF （路径青）

color/family/bole-primary #DC143C 🎯 千里·伯乐（知遇红）
color/family/bole-accent #F59E0B （推荐橙）

color/family/wanyu-primary #C0C0C0 🤔 语枢·万物（洞察银）
color/family/wanyu-accent #6C5CE7 （品牌紫）

color/family/zongshi-primary #2E8B57 📚 格物·宗师（进化绿）
color/family/zongshi-accent #00D4FF （数据青）

color/family/tianshu-primary #5E2C8A 🧠 元启·天枢（决策紫）
color/family/tianshu-accent #DC143C （号令红）

color/family/xianzhi-primary #4B0082 🔮 预见·先知（预言靛）
color/family/xianzhi-accent #00D4FF （趋势青）

color/family/lingyun-primary #FF8C00 🎨 创想·灵韵（灵感橙）
color/family/lingyun-accent #FFD700 （创意金）

## Modes（必须完整）

Light / Dark
Density/Comfortable / Density/Compact
（Breakpoint 通过约束实现，不用 Mode）
