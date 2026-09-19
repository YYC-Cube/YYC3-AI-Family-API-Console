---
file: CONVENTIONS.md
description: YYC³ 团队规范在本仓库的落地映射 — 五高五标五化五维执行细则
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-09-18
updated: 2026-09-18
status: stable
tags: [规范],[标准],[五维],[团队规范]
category: policy
language: zh-CN
audience: developers
complexity: intermediate
---

# 团队规范落地映射 | Team Conventions Mapping

> 本文是 YYC³ 团队统一开发标准（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/标规文档/YYC3-团队规范-开发标准.md`） 在本仓库的**执行细则**——不重复标准原文，只定义「标准 → 本仓库实况」的对应关系。

## 一、五维驱动映射 | Five-Dimensional Drive

| 五维       | 本仓库载体                                                                 | 度量                                 |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------ |
| **时间维** | CI 总闸分阶段耗时（install→build）、Playwright timeout 预算、SW 预缓存策略 | build < 10min、TTFB 预算             |
| **空间维** | 八智能体领域分域（`src/domains/`）、`@` 别名收敛、契约目录隔离             | 模块边界清晰、无跨域直引             |
| **属性维** | `tsc strict` + axe WCAG AA + Trivy 扫描 + Lighthouse 五类                  | 0 type errors · 0 serious violations |
| **事件维** | SSE 七态状态机、契约漂移事件、visual diff 事件、failure notify             | 每事件有门禁闭环                     |
| **关联维** | OpenAPI 契约关联（52 端点）、智能体协同矩阵、标签关联体系                  | 漂移即阻断、标签可追溯               |

## 二、五高架构落点 | Five-High Touchpoints

| 五高   | 本仓库实现                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| 高可用 | SW 离线兜底（`offline.html`）、契约漂移被动巡检（每日 02:00 UTC）                                              |
| 高性能 | Vite 8 生产构建（minify + gzip）、`networkidle` 稳定截图策略、动态发光元素阈值分级                             |
| 高安全 | gitleaks + Trivy 双扫描、`.env*` 全量忽略、`VITE_*` 密钥纪律、零信任约定（[SECURITY](../.github/SECURITY.md)） |
| 高扩展 | 智能体即模块（新智能体 = 新 domain 文件 + 路由注册）、契约先行（先冻结后开发）                                 |
| 高智能 | 八智能体协同控制台、SSE 流式推理、路由策略可视化                                                               |

## 三、五标体系落点 | Five-Standard Touchpoints

| 五标   | 本仓库实现                                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------- |
| 标准化 | 项目命名 `yyc3-ai-family-api-console`（`yyc3-` 前缀 + kebab-case）；端口 3030；文档 frontmatter 全量             |
| 规范化 | Conventional Commits + 分支模型（[CONTRIBUTING](../.github/CONTRIBUTING.md)）+ 标签治理（[LABELS](./LABELS.md)） |
| 自动化 | 五闸 CI/CD 全自动（[CICD](./CICD.md)）、Makefile 本地对齐、Corepack 锁定 pnpm                                    |
| 可视化 | Mermaid 架构图、视觉基线 32 快照、Lighthouse 审计、UI 本身即可视化控制台                                         |
| 智能化 | 八智能体领域域、`useWanyuChat` 流式 Hook、路由追踪                                                               |

## 四、文档 frontmatter 强制规范

本仓库所有**新建** `.md` 文档必须携带 YAML Front Matter（docs.yml 门禁校验）：

```yaml
---
file: {文件名}
description: {一句话描述，≤50 字}
author: {姓名} <{邮箱}>
version: v{MAJOR}.{MINOR}.{PATCH}
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft | active | stable | deprecated
tags: [标签1],[标签2],[标签3]
category: general | technical | api | project | design | guide | policy
language: zh-CN
---
```

每次更新文档：`updated` 刷新 + `version` 按 SemVer 递增 + 文末变更历史表追加。

## 五、代码与命名规范速查

| 对象            | 规范                                               | 本仓库示例                                 |
| --------------- | -------------------------------------------------- | ------------------------------------------ |
| 领域组件文件    | 智能体名 + 用途，camelCase/kebab-case 混合遵循现状 | `xianzhi-monitor.tsx`、`lingyun-cache.tsx` |
| Hook            | `use` 前缀 camelCase                               | `useWanyuChat.ts`、`useReadonly.ts`        |
| 配置            | kebab-case / 工具约定名                            | `vite.config.ts`、`tsconfig.json`          |
| 路由 path       | 全小写英文单词                                     | `/playground`、`/governance`               |
| scope（commit） | 智能体域名 / infra / docs / contract               | `feat(wanyu): add stream retry`            |

## 六、标规文档索引 | Standards Index

| 文档                                                                                                             | 用途                                   |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| YYC3-团队核心-五维驱动（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/标规文档/YYC3-团队核心-五维驱动.md`） | 五高五标五化五维官方标准全文           |
| YYC3-团队规范-开发标准（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/标规文档/YYC3-团队规范-开发标准.md`） | 文档/代码/命名/质量全量标准            |
| YYC3-团队规范-文档闭环（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/标规文档/YYC3-团队规范-文档闭环.md`） | 文档生命周期闭环机制                   |
| YYC3-团队通用-开发文档（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/标规文档/YYC3-团队通用-开发文档.md`） | AI 协同开发流程（00-03 文档体系）      |
| YYC3-多端适配-规范文档（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/标规文档/YYC3-多端适配-规范文档.md`） | PWA 五端适配规范                       |
| 验收系统/（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/验收系统/`）                                       | 16 篇验收标准（a11y/视觉/契约/性能等） |
| 模版闭环/（本地留存：`./YYC3-AI-Family-Token-Console-团队规范/模版闭环/`）                                       | 团队协作风暴板母版（本文档套件的蓝本） |

---

<div align="center">**® YANYUCLOUDCUBE** · © 2025-2026 言语（河南）智能科技有限公司</div>
