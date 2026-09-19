---
file: LABELS.md
description: YYC³ AI Family Token Console 仓库标签体系设计 — 智能体域·类型·优先级·状态四轴治理
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-09-18
updated: 2026-09-18
status: stable
tags: [labels],[governance],[协作],[trisage]
category: policy
language: zh-CN
audience: developers,managers
complexity: basic
---

# 仓库标签体系设计 | Repository Labels Design

> **标签即元数据，元数据即治理** —— 每一个 Issue/PR 通过「类型 + 模块 + 优先级 + 状态」四轴正交标注，实现自动化分诊、检索与度量。
> Labels are metadata; metadata is governance — every Issue/PR is annotated on four orthogonal axes for automated triage, search, and metrics.

## 一、设计原则 | Design Principles

| 原则             | 说明                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| **四轴正交**     | 类型（what）/ 模块（where）/ 优先级（how soon）/ 状态（how far）互不重叠          |
| **智能体即模块** | 模块轴直接映射八智能体领域域（`src/domains/`），代码边界 = 标签边界               |
| **色随域动**     | 模块标签色板对齐各智能体在控制台 UI 中的主题色，跨 Issue/PR/UI 视觉一致           |
| **最小标注集**   | Issue = 1 类型 + 1 模块 + 1 优先级；PR = 1 类型 + 1 模块。禁止冗余堆叠            |
| **机器可读**     | 全量定义于 [`.github/labels.json`](../.github/labels.json)，可被 Actions 一键同步 |

## 二、四轴体系 | Four Axes

### 轴 1 · 类型 Type（what）

| 标签              | 色值          | 语义                       | Conventional Commit          |
| ----------------- | ------------- | -------------------------- | ---------------------------- |
| `feature`         | `0E8A16` 绿   | 新功能                     | `feat`                       |
| `enhancement`     | `A2EEEF` 青   | 现有功能增强               | `refactor` / `feat`（小步）  |
| `bug`             | `D73A4A` 红   | 缺陷/回归                  | `fix`                        |
| `documentation`   | `0075CA` 蓝   | 文档与知识库               | `docs`                       |
| `performance`     | `FB9050` 橙   | 性能优化                   | `perf`                       |
| `security`        | `B60205` 深红 | 安全与合规                 | `fix(security)`              |
| `ci`              | `1D76DB` 靛蓝 | CI/CD 流水线               | `ci`                         |
| `breaking-change` | `D93F0B` 橙红 | 破坏性变更（叠加迁移说明） | `feat!` / `BREAKING CHANGE:` |

### 轴 2 · 模块 Module（where）—— 智能体域色板

> 色板与控制台 UI 各智能体主题色一一对应，实现「Issue 列表即家族拓扑」。

| 标签           | 色值          | 智能体  | 领域域文件（`src/domains/`）               | 路由                                  |
| -------------- | ------------- | ------- | ------------------------------------------ | ------------------------------------- |
| `mod:tianshu`  | `0EA5E9` 天青 | 🧭 天枢 | `tianshu.tsx`                              | `/` `/dashboard` `/mcp` `/governance` |
| `mod:bole`     | `8B5CF6` 紫   | 🐴 伯乐 | `bole.tsx`                                 | `/models`                             |
| `mod:wanyu`    | `EC4899` 粉   | 💬 万语 | `wanyu.tsx` + `useWanyuChat`               | `/playground`                         |
| `mod:qianxing` | `F59E0B` 金   | 🛣️ 千行 | `qianxing.tsx`                             | `/routing`                            |
| `mod:zongshi`  | `10B981` 翠   | 📚 宗师 | `zongshi-knowledge.tsx`                    | `/knowledge`                          |
| `mod:lingyun`  | `06B6D4` 青   | ☁️ 凌云 | `lingyun-cache.tsx` `lingyun-branding.tsx` | `/cache` `/branding`                  |
| `mod:xianzhi`  | `6366F1` 靛   | 📡 仙知 | `xianzhi-monitor.tsx`                      | `/monitor`                            |
| `mod:zhihui`   | `EF4444` 赤   | 🛡️ 智绘 | `zhihui.tsx` `zhihui-errors.tsx`           | `/security`                           |

**横切模块 Cross-cutting**：

| 标签           | 色值            | 覆盖范围                                              |
| -------------- | --------------- | ----------------------------------------------------- |
| `mod:contract` | `1F4E79` 深海蓝 | `src/lib/api.ts` · `contracts/` · `scripts/contract/` |
| `mod:infra`    | `0969DA` 亮蓝   | `.github/` · `Makefile` · `playwright.config.ts`      |
| `mod:docs`     | `5319E7` 亮紫   | `docs/` · `README` · 全部 `.md`                       |
| `mod:pwa`      | `B700FF` 品红   | `public/manifest*` · `sw.js` · `yyc3-icons/`          |

**横切归属裁决**：当变更同时命中多个模块，按「受影响路由优先 → 横切模块兜底」原则取**主**模块一个，其余在描述中说明。

### 轴 3 · 优先级 Priority（how soon）—— 仅 Issue

| 标签                | 语义                 | 响应目标                  |
| ------------------- | -------------------- | ------------------------- |
| `priority:critical` | P0 生产阻断/安全事件 | 立即（对齐 SECURITY SLA） |
| `priority:high`     | P1 本迭代必修        | ≤ 1 迭代                  |
| `priority:medium`   | P2 排期处理          | ≤ 2 迭代                  |
| `priority:low`      | P3 积压池            | 择机                      |

### 轴 4 · 状态 Status（how far）—— 工作流生命周期

```
status:needs-triage ──分诊──▶ status:triaged ──认领──▶ status:in-progress
                                                     │
        status:awaiting-feedback ◀──需作者补充────────┤
                    │                                ▼
                    └─补充后─────────────────▶ status:needs-review ──批准──▶ ✅ Done
                    │
status:blocked（任意态可进入，须注明阻塞原因）
status:duplicate / status:wontfix（终态，附理由）
```

## 三、应用矩阵 | Application Matrix

| 场景          | 必选标签组合                                                            |
| ------------- | ----------------------------------------------------------------------- |
| Bug Issue     | `bug` + `mod:*` + `priority:*` + `status:needs-triage`（模板自动）      |
| Feature Issue | `feature` + `mod:*` + `status:needs-triage`（模板自动，分诊时补优先级） |
| Docs Issue    | `documentation` + `mod:docs`（或具体文档模块）                          |
| PR            | 1 类型 + 1 模块（+ `breaking-change` 如适用）                           |

## 四、治理与自动化 | Governance & Automation

- **单一真值**：[`.github/labels.json`](../.github/labels.json) 为唯一标签定义源；新增/改名须经 PR 评审
- **批量同步**（可选，仓库管理员执行）：

```bash
npx github-label-sync --labels .github/labels.json --allow-added-labels \
  YYC-Cube/YYC3-AI-Family-API-Console
```

- **仓库级 Topics**（检索面标签，区别于 Issue 标签）见 [`.github/REPO-METADATA.md`](../.github/REPO-METADATA.md) —— 五维分层：领域域 / 技术栈 / 质量域 / 品牌域
- **度量闭环**：`status:*` 流转时长可作为交付健康度指标（五维·时间维），季度复盘

## 五、与模版母版的差异说明 | Delta from Template

相对团队模版母版（模版闭环 `labels.json` 的 00-13 目录编号体系），本仓库按「智能体领域域」重写模块轴——因为本仓库代码边界是八智能体 domains，而非文档章节编号。类型/优先级/状态三轴保持团队级一致。

---

<div align="center">**® YANYUCLOUDCUBE** · © 2025-2026 言语（河南）智能科技有限公司</div>
