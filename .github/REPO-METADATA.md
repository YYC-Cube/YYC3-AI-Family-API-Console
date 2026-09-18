# 🏷️ GitHub 仓库元信息设计 — YYC3-AI-Family-API-Console

> 推送后一键应用：`gh repo edit YYC-Cube/YYC3-AI-Family-API-Console --description "..." --add-topic ...`
> 或在 Settings → General 中按下方配置填写。

## Description（一句话简介 · ≤350 字符）

```
统一模型网关 · 八智能体协同控制台 — 52 端点契约冻结 · SSE 七态状态机 · axe-core WCAG AA · 36 视觉基线 · 5 条 CI 流水线 | Unified model gateway console with observable & debuggable multi-agent orchestration. 言启象限 · 语枢未来
```

## Website

```
https://api.0379.world
```

## Topics（≤20 个 · 小写连字符）

```bash
gh repo edit YYC-Cube/YYC3-AI-Family-API-Console \
  --add-topic ai-gateway \
  --add-topic model-gateway \
  --add-topic llm-console \
  --add-topic react \
  --add-topic typescript \
  --add-topic vite \
  --add-topic pwa \
  --add-topic tailwindcss \
  --add-topic radix-ui \
  --add-topic shadcn-ui \
  --add-topic sse \
  --add-topic observability \
  --add-topic playwright \
  --add-topic axe-core \
  --add-topic ci-cd \
  --add-topic github-actions \
  --add-topic openai-compatible \
  --add-topic multi-agent \
  --add-topic yyc3 \
  --add-topic yanyucloudcube
```

### Topic 分层说明（五维驱动）

| 层 | Topics | 作用 |
| --- | --- | --- |
| 领域域 | `ai-gateway` `model-gateway` `llm-console` `multi-agent` `openai-compatible` | 检索主路径：AI 网关/控制台 |
| 技术栈 | `react` `typescript` `vite` `tailwindcss` `radix-ui` `shadcn-ui` `pwa` `sse` | GitHub Topic 精确匹配生态 |
| 质量域 | `observability` `playwright` `axe-core` `ci-cd` `github-actions` | 五标体系：自动化/可视化 |
| 品牌域 | `yyc3` `yanyucloudcube` | 生态化：组织内互链 |

## Releases 标签规范

- 格式：`v{major}.{minor}.{patch}`（当前 `v5.1.0`，与 CHANGELOG.md 对齐）
- 命名空间：由 [release.yml](../.github/workflows/release.yml) 自动打 tag + 生成 Release Notes

## 徽章体系（README 顶部已配置）

Shield URL 前缀统一 `https://api.0379.world`（生产）+ GitHub Actions 工作流徽章 5 条：
`ci` · `contract` · `a11y` · `visual` · `docs`
