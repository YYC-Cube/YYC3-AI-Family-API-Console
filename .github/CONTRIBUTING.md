# 贡献指南 | Contributing Guide

> 感谢您对 YYC³ AI Family Token Console 的关注！本指南帮助您快速完成第一次贡献。
> Thanks for your interest in contributing! This guide gets your first PR merged fast.

---

## 1. 快速通道 | Fast Path

```bash
# 1. Clone（或 Fork 后 Clone）
git clone https://github.com/YYC-Cube/YYC3-AI-Family-API-Console.git
cd YYC3-AI-Family-API-Console

# 2. 安装依赖（Corepack 自动启用 pnpm，见 package.json packageManager）
corepack enable
pnpm install --frozen-lockfile

# 3. 启动开发服务器（YYC³ 团队规范：端口 3030 起）
pnpm dev          # → http://localhost:3030

# 4. 分支 & 开发
git checkout -b feat/your-topic develop   # 或 main（当前单干线上下文）

# 5. 本地门禁（与 CI 同款 same gates as CI）
make check        # lint + typecheck
pnpm test:e2e     # a11y 全链路（构建 + 预览 + axe 扫描）

# 6. 提交并推送（Conventional Commits）
git commit -m "feat(routing): add fallback route for unknown models"
git push origin feat/your-topic
# 7. 在 GitHub 上开 PR，按模板勾选标签与检查单
```

---

## 2. 环境要求 | Prerequisites

| 依赖 Dependency | 版本 Version | 必需 Required |
|-----------------|-------------|:---:|
| Git | 2.40+ | ✅ |
| Node.js | 20+（22 LTS 推荐） | ✅ |
| pnpm（经 Corepack） | 11+（`packageManager` 锁定） | ✅ |
| Playwright 浏览器 | chromium | ⬜（跑测试 testing） |
| GNU Make | 4.0+ | ⬜（快捷命令 shortcuts） |

```bash
# 测试浏览器安装（一次性）
pnpm exec playwright install chromium --with-deps
```

---

## 3. 分支模型 | Branching Model

```
main (protected 生产分支)
 └── develop          ←─ 集成分支 integration branch
      ├── feat/*      功能开发 features
      ├── fix/*       缺陷修复 bug fixes
      ├── docs/*      文档 documentation
      ├── perf/*      性能 performance
      ├── ci/*        流水线 pipeline
      └── refactor/*  重构 refactoring
```

- `main` 受分支保护（必需检查通过），禁止 force-push。
  `main` is protected (required checks); force-push disabled.
- 功能分支生命周期 ≤ 2 周，过期请 rebase。
  Feature branches live ≤ 2 weeks; rebase when stale.

---

## 4. 提交规范 | Commit Convention

遵循 **Conventional Commits**：

```text
<type>(<scope>): <subject>

<body 可选 optional>
<footer 可选 optional>   # e.g. BREAKING CHANGE: migration note / Closes #123
```

| type | 用途 Usage | 对应标签 Label |
|------|-----------|----------------|
| `feat` | 新功能 new feature | `feature` |
| `fix` | 缺陷修复 bug fix | `bug` |
| `docs` | 文档 documentation | `documentation` |
| `perf` | 性能 performance | `performance` |
| `refactor` | 重构（不改行为）refactor w/o behavior change | `enhancement` |
| `test` | 测试 tests | — |
| `ci` | 流水线 pipeline | `ci` |
| `chore` | 杂项 chores | — |

**scope 建议 suggested scopes**: 智能体域名（`tianshu`/`bole`/`wanyu`/`qianxing`/`lingyun`/`xianzhi`/`zhihui`/`zongshi`）、`infra`、`docs`、`contract`。

---

## 5. 标签使用 | Labels

提交 Issue / PR 时请按 [`.github/labels.json`](./labels.json) 选择标签：
**1 类型 + 1 模块 + 1 优先级**（Issue），**1 类型 + 1 模块**（PR）。
Pick labels per [`labels.json`](./labels.json): type + module + priority for Issues; type + module for PRs.

---

## 6. PR 检查单 | PR Checklist

- [ ] 分支基于最新 `develop`（或 `main`），提交符合 Conventional Commits
- [ ] `make check` 本地通过（lint + typecheck 零错误）
- [ ] `pnpm test:e2e` a11y 门禁通过（serious/critical 违规 = 阻断）
- [ ] UI 变更已同步视觉基线（`pnpm test:visual:update` + 人工审阅 diff）
- [ ] API 变更已同步契约快照（`pnpm contract:freeze` + 影响面复核）
- [ ] PR 标题、描述完整，已选类型/模块标签
- [ ] 涉及文档时同步更新（中文在上，英文在下）
- [ ] 不包含密钥/凭证（gitleaks 闸强制拦截；`VITE_*` 变量会进客户端产物，严禁放私密密钥）
- [ ] 新增代码有对应测试；修复附回归用例
- [ ] 大型变更（>500 行）已开 Issue 先行对齐设计

> CI 全绿后 @ 维护者 review；批准后 squash merge。

---

## 7. 三大专项门禁 | Specialized Gates

| 门禁 Gate | 触发路径 | 处理方式 Handling |
|-----------|---------|------------------|
| ♿ [a11y.yml](./workflows/a11y.yml) | `src/**` `e2e/**` | axe-core WCAG 2.2 AA，serious/critical → 必须修复 |
| 🎨 [visual.yml](./workflows/visual.yml) | `src/**` 视觉相关 | diff 报告审阅 → 预期变更则 `pnpm test:visual:update` 冻结新基线 |
| 📜 [contract.yml](./workflows/contract.yml) | `src/lib/api.ts` `contracts/**` | 漂移 → 复核 `src/lib/api.ts` 类型同步 → `pnpm contract:freeze` |

---

## 8. 文档贡献规范 | Documentation Standards

1. **双语对照**：中文段落在上，English 在下；代码块/图表/标签名保持英文。
   Bilingual: Chinese first, English second; code/diagrams/labels in English.
2. **frontmatter**：新增 md 文档需带 YAML 元数据（`file/description/author/version/created/updated/status/tags/category`），详见 [docs/CONVENTIONS.md](../docs/CONVENTIONS.md)。
3. **图表**：优先 Mermaid；架构图配色遵循项目深空蓝 + 青色主题。
4. **链接**：站内相对链接；CI 文档构建零死链门禁（lychee）。

---

## 9. 报告缺陷 | Reporting Bugs

使用 [Bug Report 模板](./ISSUE_TEMPLATE/bug_report.yml)并附：复现步骤 / 期望行为 / 实际行为 / 环境信息 / 日志（脱敏）。
Use the [Bug Report template](./ISSUE_TEMPLATE/bug_report.yml) with steps / expected / actual / environment / sanitized logs.

安全漏洞请勿走公开 Issue——参见 [`SECURITY.md`](./SECURITY.md)。
Do **not** open public issues for security vulnerabilities — see [`SECURITY.md`](./SECURITY.md).

---

## 10. 行为准则与联系 | Code of Conduct & Contact

参与本项目即表示您同意 [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)。

| 事项 Topic | 邮箱 Email |
|-----------|------------|
| 开发问题 Development | dev@0379.email |
| 文档 Documentation | docs@0379.email |
| 技术支持 Support | support@0379.email |
| 安全 Security | sec@0379.email |

---

<div align="center">

**® YANYUCLOUDCUBE** · © 2025-2026 言语（河南）智能科技有限公司 · Yanyu Intelligent Technology Co., Ltd.

</div>
