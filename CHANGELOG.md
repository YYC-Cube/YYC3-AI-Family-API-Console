---
file: CHANGELOG.md
description: YYC³ AI Family Token Console 变更日志 — 语义化版本全量记录
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-09-18
updated: 2026-09-18
status: stable
tags: [changelog],[release],[semver]
category: general
language: zh-CN
---

# Changelog

本项目的所有重要变更将记录于此文件。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本管理遵循 [SemVer 2.0.0](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added 新增

- **CI 自动部署**：[deploy.yml](.github/workflows/deploy.yml) 七闸闭环——push main 自动 `质量门禁(tsc+build) → SPA 404 回退 → dist 冒烟(CNAME/manifest/sw/canonical) → GitHub Pages 部署 → 域名探针`，站点 **<https://token.yyc3.top>**
- **自定义域名**：`public/CNAME`（token.yyc3.top）随 dist 发布

### Changed 变更

- **域名全量统一** `yanyucloudcube.com` → `token.yyc3.top`：`index.html`（canonical/og:url）、`sitemap.xml`（13 loc）、`robots.txt`、`manifest.webmanifest`、`.well-known/{assetlinks.json, security.txt}`
- **docs.yml 职责收敛**：移除 Pages 部署（Pages 单站点仅允许一个部署方，应用 dist 为唯一主体），退化为纯文档校验并新增 PR 触发

### Fixed 修复

- Issue 模板 `config.yml`：3 个 `mailto:` 联系链接改为合法 `https://` URL（GitHub Schema 校验合规），邮箱改述于 about 文案

## [v1.0.0] - 2026-09-18

> *言启千行 · 语枢万物智能* — 首个正式初始化版本

### Added 新增

- **统一网关控制台**：12 路由页面（首页大盘 / Dashboard / Models / Playground / Routing / Knowledge / MCP / Cache / Monitor / Security / Branding / Governance），React 19 + react-router 8 `createBrowserRouter` 架构（`src/App.tsx`）
- **八智能体领域域**：`src/domains/` 按智能体分域组织（天枢/伯乐/万语/千行/凌云/仙知/智绘/宗师），共享层 `shared.tsx` 统一 Status/卡片原语
- **API 客户端**：`src/lib/api.ts` OpenAI 兼容 `/v1` RESTful 客户端，52 端点契约冻结于 `contracts/openapi.snapshot.json`
- **契约漂移门禁**：`scripts/contract/check.mjs` + [`.github/workflows/contract.yml`](.github/workflows/contract.yml)（sha256 规范化对比，漂移阻断合并）
- **CI/CD 五闸流水线**：`ci.yml`（install→typecheck→lint→security→build→e2e-a11y→visual→lighthouse→notify）、`a11y.yml`（axe-core WCAG 2.2 AA 门禁）、`visual.yml`（32 快照回归门禁）、`docs.yml`（markdownlint + lychee 死链 + frontmatter 校验 + Pages 部署）、`release.yml`（tag 触发三段式发布）
- **PWA 全端矩阵**：iOS / Android / macOS / watchOS / Web 五端图标体系（`public/yyc3-icons/`）、`manifest.webmanifest`、`sw.js` 五维驱动 Service Worker、`offline.html` 离线兜底
- **SEO 全家桶**：Open Graph + Twitter Card + canonical + `robots.txt` + `sitemap.xml` + `.well-known/{security.txt, apple-app-site-association, assetlinks.json}`
- **E2E 测试体系**：`e2e/specs/a11y.spec.ts`（axe-core 五路由扫描 + 品牌持久化 + 移动视口）、`visual*.spec.ts`（12 路由 × dark/light + 8 徽章 + 2 组件基线）
- **开发者文档全套**：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/CICD.md](docs/CICD.md) · [docs/CONVENTIONS.md](docs/CONVENTIONS.md) · [docs/DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md) · [docs/index.md](docs/index.md) · [CONTRIBUTING](.github/CONTRIBUTING.md) · [SECURITY](.github/SECURITY.md) · [CODE_OF_CONDUCT](.github/CODE_OF_CONDUCT.md)
- **协作风暴板**：Issue 模板三件套（bug/feature/docs）+ PR 模板 + 标签体系（`.github/labels.json`）
- **质量基线**：pnpm lockfile 冻结（CI `--frozen-lockfile` 唯一真值）、`.gitignore` 全量、Makefile 常用命令快捷层

### Changed 变更

- 包名 `figma-make-app` → `yyc3-ai-family-api-console`（YYC³ 项目命名标准：`yyc3-` 前缀 + kebab-case）
- 锁定 `packageManager: pnpm@11.10.0`（Corepack 闭环，开发/CI 版本一致）

### Security 安全

- gitleaks 密钥扫描 + Trivy HIGH/CRITICAL 文件系统扫描纳入 CI 必过门禁
- 密钥端侧保护约定：`.env*` 全量忽略（`.env.example` 白名单除外）

[Unreleased]: https://github.com/YYC-Cube/YYC3-AI-Family-API-Console/compare/v1.0.0...HEAD
[v1.0.0]: https://github.com/YYC-Cube/YYC3-AI-Family-API-Console/releases/tag/v1.0.0
