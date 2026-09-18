---
file: DEVELOPER-GUIDE.md
description: YYC³ AI Family Token Console 开发者指南 — 从克隆到首个 PR 全链路
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-09-18
updated: 2026-09-18
status: stable
tags: [guide],[onboarding],[developer-experience]
category: guide
language: zh-CN
audience: developers
complexity: basic
---

# 开发者指南 | Developer Guide

> *不盲猜、不盲测、不盲从 —— 以代码为准绳，以文档为纽带*

## 一、环境初始化 | One-Time Setup

```bash
# 1. 克隆
git clone https://github.com/YYC-Cube/YYC3-AI-Family-API-Console.git
cd YYC3-AI-Family-API-Console

# 2. 启用 Corepack（自动锁定 pnpm 11.10.0，与 CI 完全一致）
corepack enable

# 3. 安装依赖（冻结锁文件，禁止自动升级）
pnpm install --frozen-lockfile

# 4. 安装 Playwright 浏览器（跑测试需要，一次性）
pnpm exec playwright install chromium

# 5. 验证环境
make check && pnpm build   # 全绿即就绪
```

> **Node 22 LTS 推荐**。CI 使用 Node 20，本地 20/22 均可（`engines` 未强制）。

## 二、日常开发循环 | Daily Loop

```bash
pnpm dev            # 启动开发服务器 → http://localhost:3030（团队规范端口）
pnpm build          # 生产构建（~300ms，Vite 8）
pnpm preview        # 预览生产产物（同为 3030）
make check          # 提交前快检：oxfmt + tsc strict
pnpm test:e2e       # a11y 全链路（自动 build + preview + axe 扫描）
pnpm test:visual    # 视觉回归（32 快照对比）
```

**Playwright 细节**：测试自动构建并以 `127.0.0.1:4173` 起 preview server（`reuseExistingServer: false`）。特殊环境可通过 `PLAYWRIGHT_CHROMIUM` 指定系统浏览器路径。

## 三、常见任务手册 | How-To

### 3.1 新增一个路由页面（新智能体域）

1. 在 `src/domains/` 新建 `{agent}.tsx`（参照 `bole.tsx` 结构，从 `shared.tsx` 引 `pages/family/Status`）
2. 在 `src/domains/shared.tsx` 注册 `pages` 数组项（family/path/nav）
3. 在 `src/App.tsx` 路由表 `children` 注册 `{ path, Component }`
4. 若纳入 a11y 门禁：在 `e2e/specs/a11y.spec.ts` routes 数组追加
5. 若纳入视觉基线：在 `e2e/visual-routes.spec.ts` ROUTES 追加，并 `pnpm test:visual:update` 冻结新快照

### 3.2 契约变更（后端 API 漂移）

```bash
pnpm contract:check     # 查看漂移详情（sha256 对比）
# 人工复核 src/lib/api.ts 类型影响面（Dashboard/Routing/Cache/Playground 优先）
pnpm contract:freeze    # 确认兼容后冻结新快照
git add contracts/ && git commit -m "chore(contract): sync openapi snapshot"
```

### 3.3 UI 变更后的视觉基线更新

```bash
pnpm test:visual              # 复现 diff
# 人工审阅：预期变更 → 冻结；非预期 → 排查 CSS/布局/字体
pnpm test:visual:update
git add e2e/*.spec.ts-snapshots/
git commit -m "test(visual): re-freeze baselines after <scope> restyle"
```

### 3.4 品牌定制（Branding）

品牌配置位于 `src/config/branding.ts`（`defaultBranding`），运行时经 `/branding` 页面修改并 localStorage 持久化（`useReadonly` 控制只读态）。多端图标替换见 [docs/yyc3-icon-system-design.md](./yyc3-icon-system-design.md)。

### 3.5 环境变量

```bash
# .env.local（不入库，已 gitignore）
PORT=3030                  # 开发/预览端口（默认 3030）
VITE_API_BASE=/v1          # 网关 API 基础路径
VITE_FAMILY_BUS_TOKEN=...  # FamilyBus 令牌（⚠️ 会打进客户端产物，仅放公开级令牌）
```

> `VITE_*` 前缀变量会被 Vite 静态内联进构建产物——**严禁放置私密密钥**（详见 [.github/SECURITY.md](../.github/SECURITY.md)）。

## 四、调试技巧 | Debugging

| 场景 | 方法 |
| ---- | ---- |
| SSE 流式不更新 | DevTools Network → 该请求 EventStream 面板核对 chunk；确认网关 `/healthz` |
| 品牌未持久化 | Application → Local Storage 检查 branding key；隐身窗口不共享 |
| 视觉测试本地失败但 CI 通过 | 字体渲染差异：确认关闭系统级字体平滑差异；以 `--update-snapshots` 后再 diff 审阅 |
| 端口被占 | `PORT=3031 pnpm dev`（strictPort: false 会自动顺延） |
| PWA SW 缓存旧资源 | DevTools → Application → Service Workers → Unregister，或硬刷新 |

## 五、代码评审锚点 | Review Anchors

评审聚焦优先级（从高到低）：

1. **契约安全**：`api.ts` 类型与 openapi 快照一致；无 `any` 逃逸
2. **a11y**：新交互组件有可及名（label/aria）；键盘可达
3. **领域边界**：不跨域直引其他智能体内部组件（经 `shared.tsx` 中转）
4. **性能**：路由级组件避免顶层重计算；SSE 资源卸载时清理
5. **文案双语**：UI 中文优先，关键术语附英文

## 六、新会话 AI 导师衔接 | AI Tutor Handoff

遵循 [YYC3-团队通用-开发文档](./YYC3-AI-Family-Token-Console-团队规范/标规文档/YYC3-团队通用-开发文档.md) 衔接协议：

```bash
# 快速恢复上下文
cat docs/YYC3-AI-Family-Token-Console-开发推进/03-总结文档与状态同步.md
git log --oneline -10
git status
```

深度现状分析见 [docs/YYC3-AI-Family-Token-Console-开发推进/](./YYC3-AI-Family-Token-Console-开发推进/) 与本套件的 [深度分析报告](./YYC3-AI-Family-Token-Console-开发推进/11-深度分析总结与建议指导.md)。

---

<div align="center">**® YANYUCLOUDCUBE** · © 2025-2026 言语（河南）智能科技有限公司</div>
