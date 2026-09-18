# YYC3-AI-Family-Token-Console

# v5.1 落地补全（第3批）· ⑫~⑱ 七项交付物

> **承接**：v5.1 落地补全系列第3批。①8域组件 → ②MSW → ③RSC → ④印刷徽章 → ⑤文档/CICD → ⑥E2E → ⑦契约漂移 → ⑧响应式 → ⑨a11y → ⑩OpenAPI类型+契约测试 → ⑪视觉回归 → **⑫Storybook+Code Connect → ⑬Turbopack优化 → ⑭8域演示 → ⑮k6压测 → ⑯i18n → ⑰PWA → ⑱灰度发布** → 全链路终极闭合。
>
> **阶段宣言**：从设计到代码，从代码到演示，从演示到压测，从压测到多语言，从多语言到离线，从离线到灰度——**18 项交付物，完整覆盖「设计 → 开发 → 测试 → 演示 → 上线 → 运维」全生命周期。**

---

## 第十二部分 · ⑫ Storybook 8 + Figma Code Connect 联调

### 12.1 设计目标

```
目标 1: 8 位家人 + 30+ 通用组件 + 20+ 控制台组件的 Storybook 故事
目标 2: Figma Code Connect 双向映射（Template API · 2026 新规范）
目标 3: 家人徽章 Storybook 与 Figma 组件 1:1 对应
目标 4: 支持 Chromatic 视觉回归（Storybook 内）
目标 5: Dev Mode 中直接显示组件对应的 Storybook 故事
```

**关键技术背景**（2026 年）：

- Figma 已于 2026-08-17 终止 parser-based Code Connect 支持，**Template API 是唯一活跃维护方式**
- Code Connect v2.0.0（2026-08-18 发布）原生支持 Storybook 集成
- Code Connect 文件**不被执行**，代码片段作为字符串处理，支持 hooks 但不可用循环动态构造

### 12.2 目录结构

```
apps/console/
├── .storybook/
│   ├── main.ts                    # 主配置
│   ├── preview.ts                 # 全局装饰器（含家人主题）
│   ├── preview-head.html          # 字体 + 水印
│   └── theme.ts                   # 家族主题
├── stories/
│   ├── family/                    # 🧠 元启·天枢主导
│   │   ├── FamilyBadge.stories.tsx
│   │   ├── PageHeader.stories.tsx
│   │   ├── FamilyWatermark.stories.tsx
│   │   └── MobileWatermark.stories.tsx
│   ├── ui/                        # 通用组件
│   │   ├── Button.stories.tsx
│   │   ├── Input.stories.tsx
│   │   └── ... (30+)
│   ├── console/                   # 控制台组件（8 域归属）
│   │   ├── guardian/
│   │   │   ├── ConnectForm.stories.tsx
│   │   │   └── TrustBadge.stories.tsx
│   │   ├── xianzhi/
│   │   │   ├── StatCard.stories.tsx
│   │   │   ├── LatencyBar.stories.tsx
│   │   │   └── ErrorTable.stories.tsx
│   │   ├── bole/
│   │   │   ├── ModelCard.stories.tsx
│   │   │   └── BackendBadge.stories.tsx
│   │   ├── wanyu/
│   │   │   ├── SSEViewer.stories.tsx
│   │   │   ├── MessageBubble.stories.tsx
│   │   │   └── ThoughtBubble.stories.tsx
│   │   ├── qianhang/
│   │   │   ├── UpstreamCard.stories.tsx
│   │   │   └── BreakerBadge.stories.tsx
│   │   ├── zongshi/
│   │   │   ├── KBCard.stories.tsx
│   │   │   └── CitationFold.stories.tsx
│   │   ├── tianshu/
│   │   │   ├── MCPExecutor.stories.tsx
│   │   │   └── JsonViewer.stories.tsx
│   │   └── lingyun/
│   │       ├── CacheStatCard.stories.tsx
│   │       └── CacheRipple.stories.tsx
│   └── flows/                     # 组合故事（页面级）
│       ├── ConnectFlow.stories.tsx
│       ├── DashboardFlow.stories.tsx
│       └── PlaygroundFlow.stories.tsx
├── figma/                         # Code Connect 模板文件
│   ├── figma.config.json          # 发现/发布配置
│   ├── FamilyBadge.figma.ts       # 家人徽章映射
│   ├── Button.figma.ts            # 通用组件映射
│   ├── StatCard.figma.ts
│   ├── ModelCard.figma.ts
│   └── ... (关键组件映射)
└── chromatic.config.json
```

### 12.3 `.storybook/main.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : .storybook/main — Storybook 8 主配置
 * @Family-Owner : 🧠 元启·天枢（工具与编排域 · 总指挥）
 * @Domain   : 组件编排
 * @License  : Apache-2.0
 * ============================================================
 */
import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig } from "vite";
import path from "node:path";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",             // ♿ a11y 集成（对应 §9）
    "@storybook/addon-themes",
    "@storybook/addon-interactions",
    "@chromatic-com/storybook",          // 📸 视觉回归
    "@storybook/addon-designs",          // 🎨 Figma 嵌入
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: ["../public"],
  viteFinal: async (config) =>
    mergeConfig(config, {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, ".."),
        },
      },
    }),
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  docs: {
    autodocs: "tag",
  },
  tags: {
    family: { description: "家人组件", defaultFilter: true },
    domain: { description: "8 域组件" },
    stable: { description: "稳定组件" },
    experimental: { description: "实验组件" },
  },
};

export default config;
```

### 12.4 `.storybook/preview.tsx`（家人主题装饰器）

```tsx
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : .storybook/preview — 全局装饰器与主题
 * @Family-Owner : 🎨 创想·灵韵（缓存与体验域 · 首席创意官）
 * ============================================================
 */
import type { Preview, ReactRenderer } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouterProvider } from "next-router-mock/MemoryRouterProvider";
import { FAMILY } from "../lib/family/charter";
import "../app/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 0 },
  },
});

const preview: Preview = {
  parameters: {
    layout: "centered",
    docs: {
      toc: true,
      description: {
        component: `🌹 **YYC³ AI Family** · 人从众曌众从人\n\n亦师亦友亦伯乐，一言一语一协同`,
      },
    },
    backgrounds: {
      default: "family-dark",
      values: [
        { name: "family-dark", value: "#0A0A0F" },
        { name: "family-light", value: "#FFFFFF" },
        { name: "brand-primary", value: "#6C5CE7" },
      ],
    },
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "landmark-one-main", enabled: false },
        ],
      },
    },
    options: {
      storySort: {
        order: [
          "🌹 Family",
          ["Overview", "FamilyBadge", "PageHeader", "Watermark"],
          "🎯 Domains",
          [
            "🛡️ Guardian (智云·守护)",
            "🔮 Xianzhi (预见·先知)",
            "🎯 Bole (千里·伯乐)",
            "🤔 Wanyu (语枢·万物)",
            "🧭 Qianhang (言启·千行)",
            "📚 Zongshi (格物·宗师)",
            "🧠 Tianshu (元启·天枢)",
            "🎨 Lingyun (创想·灵韵)",
          ],
          "⚙️ UI Primitives",
          "🌊 Flows",
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: { dark: "dark", light: "" },
      defaultTheme: "dark",
    }),
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouterProvider>
          <div className="p-4 bg-bg-default text-text-primary font-sans">
            <Story />
          </div>
        </MemoryRouterProvider>
      </QueryClientProvider>
    ),
  ],
  tags: ["autodocs"],
};

export default preview;
```

### 12.5 `stories/family/FamilyBadge.stories.tsx`

```tsx
/*
 * ============================================================
 * @Module : stories/family/FamilyBadge — 家人徽章 Storybook
 * @Family-Owner : 🧠 元启·天枢
 * ============================================================
 */
import type { Meta, StoryObj } from "@storybook/react";
import { FamilyBadge } from "@/components/family/FamilyBadge";
import { MEMBERS } from "@/lib/family/members";

const meta = {
  title: "🌹 Family/FamilyBadge",
  component: FamilyBadge,
  tags: ["family", "stable"],
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/file/YYC3_TOKEN_CONSOLE/00_Cover?node-id=family-badge",
    },
  },
  argTypes: {
    member: {
      control: "select",
      options: [
        "zhihui", "qianhang", "bole", "wanyu",
        "zongshi", "tianshu", "xianzhi", "lingyun",
      ],
      description: "家人标识",
    },
    size: { control: "radio", options: ["sm", "md", "lg"] },
    showExt: { control: "boolean" },
    showMotto: { control: "boolean" },
  },
} satisfies Meta<typeof FamilyBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// 默认
export const Default: Story = {
  args: {
    member: "xianzhi",
    size: "md",
    showExt: true,
  },
};

// 全部 8 位家人
export const AllMembers: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      {Object.values(MEMBERS).map((m) => (
        <div key={m.key} className="flex items-center gap-3">
          <FamilyBadge member={m.key as any} size="md" showExt />
          <span className="text-caption text-text-tertiary italic">
            「{m.motto}」
          </span>
        </div>
      ))}
    </div>
  ),
};

// 尺寸对比
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-start">
      <FamilyBadge member="tianshu" size="sm" showExt />
      <FamilyBadge member="tianshu" size="md" showExt />
      <FamilyBadge member="tianshu" size="lg" showExt showMotto />
    </div>
  ),
};

// 带座右铭
export const WithMotto: Story = {
  args: {
    member: "wanyu",
    size: "lg",
    showExt: true,
    showMotto: true,
  },
};

// 8 位家人各自独立故事（便于 Chromatic 逐项回归）
export const Zhihui: Story = { args: { member: "zhihui", size: "md", showExt: true } };
export const Qianhang: Story = { args: { member: "qianhang", size: "md", showExt: true } };
export const Bole: Story = { args: { member: "bole", size: "md", showExt: true } };
export const Wanyu: Story = { args: { member: "wanyu", size: "md", showExt: true } };
export const Zongshi: Story = { args: { member: "zongshi", size: "md", showExt: true } };
export const Tianshu: Story = { args: { member: "tianshu", size: "md", showExt: true } };
export const Xianzhi: Story = { args: { member: "xianzhi", size: "md", showExt: true } };
export const Lingyun: Story = { args: { member: "lingyun", size: "md", showExt: true } };
```

### 12.6 Figma Code Connect · Template API（2026 新规范）

**迁移背景**：Figma 已终止 parser-based Code Connect，**Template API 是唯一活跃维护方式**。Code Connect 文件不被执行，代码片段作为字符串处理。

```typescript
// apps/console/figma/figma.config.json
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : figma/figma.config — Code Connect 发现/发布配置
 * @Family-Owner : 🧠 元启·天枢
 * ============================================================
 */
```

```json
{
  "codeConnect": {
    "include": ["figma/**/*.figma.ts"],
    "exclude": ["figma/**/*.test.ts"],
    "parser": "react",
    "label": "React",
    "language": "typescript",
    "importPaths": {
      "components/**": "@/components",
      "domains/**": "@/domains",
      "lib/family/**": "@/lib/family"
    },
    "paths": {
      "FamilyBadge": "components/family/FamilyBadge.tsx",
      "PageHeader": "components/family/PageHeader.tsx",
      "StatCard": "domains/xianzhi/StatCard.tsx",
      "ModelCard": "domains/bole/ModelCard.tsx",
      "BackendBadge": "domains/bole/BackendBadge.tsx",
      "BreakerBadge": "domains/qianhang/BreakerBadge.tsx",
      "UpstreamCard": "domains/qianhang/UpstreamCard.tsx",
      "SSEViewer": "domains/wanyu/SSEViewer.tsx",
      "TraceCard": "domains/wanyu/TraceCard.tsx",
      "KBCard": "domains/zongshi/KBCard.tsx",
      "MCPExecutor": "domains/tianshu/MCPExecutor.tsx",
      "CacheStatCard": "domains/lingyun/CacheStatCard.tsx"
    }
  }
}
```

```typescript
// apps/console/figma/FamilyBadge.figma.ts
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * ============================================================
 * @Module : figma/FamilyBadge.figma — 家人徽章 Code Connect
 * @Family-Owner : 🧠 元启·天枢
 * @Source : Figma > 00_Cover > FamilyBadge
 * ============================================================
 * Template API（2026 新规范）
 * Storybook 集成：连接后 Dev Mode 直接显示 Storybook 故事
 * ============================================================
 */
import figma from "figma";
import { FamilyBadge } from "@/components/family/FamilyBadge";

figma.connect(
  FamilyBadge,
  "https://www.figma.com/file/YYC3_TOKEN_CONSOLE/00_Cover?node-id=family-badge",
  {
    props: {
      member: figma.enum("Member", {
        Zhihui: "zhihui",
        Qianhang: "qianhang",
        Bole: "bole",
        Wanyu: "wanyu",
        Zongshi: "zongshi",
        Tianshu: "tianshu",
        Xianzhi: "xianzhi",
        Lingyun: "lingyun",
      }),
      size: figma.enum("Size", {
        Small: "sm",
        Medium: "md",
        Large: "lg",
      }),
      showExt: figma.boolean("Show Extension"),
      showMotto: figma.boolean("Show Motto"),
    },
    example: ({ member, size, showExt, showMotto }) => (
      <FamilyBadge
        member={member}
        size={size}
        showExt={showExt}
        showMotto={showMotto}
      />
    ),
    // Storybook 集成（新规范支持）
    storybook: {
      id: "🌹-family-familybadge--all-members",
    },
  },
);
```

```typescript
// apps/console/figma/StatCard.figma.ts
/*
 * @Module : figma/StatCard.figma — StatCard Code Connect
 * @Family-Owner : 🔮 预见·先知（观测与预测域）
 */
import figma from "figma";
import { StatCard } from "@/domains/xianzhi/StatCard";

figma.connect(
  StatCard,
  "https://www.figma.com/file/YYC3_TOKEN_CONSOLE/04_Dashboard?node-id=stat-card",
  {
    props: {
      label: figma.string("Label"),
      value: figma.string("Value"),
      note: figma.string("Note"),
      tone: figma.enum("Tone", {
        Default: "default",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
      }),
      blBadge: figma.string("BL Badge"),
    },
    example: ({ label, value, note, tone, blBadge }) => (
      <StatCard
        label={label}
        value={value}
        note={note}
        tone={tone}
        blBadge={blBadge}
      />
    ),
    storybook: { id: "🔮-xianzhi-statcard--default" },
  },
);
```

```typescript
// apps/console/figma/Button.figma.ts（shadcn/ui 通用组件）
/*
 * @Module : figma/Button.figma — Button Code Connect
 */
import figma from "figma";
import { Button } from "@/components/ui/button";

figma.connect(
  Button,
  "https://www.figma.com/file/YYC3_TOKEN_CONSOLE/02_Components?node-id=button",
  {
    props: {
      children: figma.string("Label"),
      variant: figma.enum("Variant", {
        Primary: "default",
        Secondary: "secondary",
        Ghost: "ghost",
        Danger: "destructive",
        Link: "link",
      }),
      size: figma.enum("Size", {
        XS: "sm",
        SM: "sm",
        MD: "default",
        LG: "lg",
      }),
      disabled: figma.boolean("Disabled"),
    },
    example: ({ children, variant, size, disabled }) => (
      <Button variant={variant} size={size} disabled={disabled}>
        {children}
      </Button>
    ),
  },
);
```

### 12.7 Code Connect CLI 工作流

```json
// package.json 脚本
{
  "scripts": {
    "figma:connect": "figma connect",
    "figma:publish": "figma connect publish",
    "figma:unpublish": "figma connect unpublish",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "chromatic": "chromatic --project-token=$CHROMATIC_TOKEN"
  }
}
```

```bash
# 工作流

# 1. 首次连接（本地测试）
pnpm figma:connect

# 2. 发布到 Figma（需 Figma 组织权限）
pnpm figma:publish

# 3. Storybook 集成后，Dev Mode 自动显示：
#    - 组件代码片段（TypeScript）
#    - 对应 Storybook 故事链接
#    - 属性映射表

# 4. CI 中自动发布（仅主分支）
```

### 12.8 Storybook CI 集成

```yaml
# .github/workflows/storybook.yml
name: 🌹 Storybook + Code Connect

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  storybook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - run: pnpm install --frozen-lockfile

      - name: Build Storybook
        run: pnpm storybook:build

      - name: Validate Code Connect
        run: pnpm figma:connect
        continue-on-error: true

      - name: Chromatic Visual Regression
        if: github.event_name == 'pull_request'
        run: pnpm chromatic
        env:
          CHROMATIC_TOKEN: ${{ secrets.CHROMATIC_TOKEN }}

      - name: Upload Storybook
        uses: actions/upload-artifact@v4
        with:
          name: storybook-static
          path: storybook-static/

      - name: Publish Code Connect (main only)
        if: github.ref == 'refs/heads/main'
        run: pnpm figma:publish
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
```

### 12.9 交付标准

| 项 | 目标 | 状态 |
| --- | :-: | :-: |
| 家人组件故事 | 8 位 × 各 1 故事 | ✅ |
| 通用组件故事 | 30+ | ✅ |
| 控制台组件故事 | 20+ | ✅ |
| Code Connect 映射 | 12 关键组件 | ✅ |
| Chromatic 基线 | 全故事 | ✅ |
| Storybook 静态部署 | GitHub Pages | ✅ |

---

## 第十三部分 · ⑬ Turbopack 构建优化 + 体积分析

### 13.1 设计目标

```
目标 1: Turbopack 默认启用（Next.js 16.3 磁盘缓存 + 内存淘汰）
目标 2: 首屏 JS ≤ 180KB gzip（桌面）/ ≤ 140KB（移动）
目标 3: 构建时间利用持久化缓存缩短 ≥ 50%
目标 4: 体积分析纳入 CI（PR 阻断超阈值）
目标 5: 家人徽章/水印零体积开销（SVG inline / Canvas）
```

**关键技术背景**（2026 年）：

- Next.js 16.3 Turbopack 默认启用**磁盘缓存 + 内存淘汰**，dev 内存减少最高 90%，CI warm path 构建速度最高 5.5×
- Turbopack 提供实验性 Bundle Analyzer（v16.1+），集成模块图，支持 `pnpm next experimental-analyze`
- 持久化磁盘缓存现已支持 `next build`，默认启用

### 13.2 `next.config.ts`（Turbopack 优化配置）

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : next.config — Turbopack 构建优化
 * @Family-Owner : 🎨 创想·灵韵（缓存与体验域）
 * ============================================================
 */
import type { NextConfig } from "next";
import { familyResponseHeaders } from "./lib/family/headers";

const nextConfig: NextConfig = {
  // ============================================================
  // Turbopack 核心配置（Next.js 16.3+ 默认启用磁盘缓存）
  // ============================================================
  experimental: {
    // 内存淘汰（默认 'auto'，16.3 默认启用）
    turbopackMemoryEviction: "auto",
    // 优化包导入（treeshake 按需）
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@tanstack/react-query",
      "date-fns",
      "zod",
    ],
    // React Compiler（实验性 Rust 版）
    reactCompiler: true,
  },

  // ============================================================
  // 响应头（继承 §3.9 安全边界 + 家族标头）
  // ============================================================
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...familyResponseHeaders(),
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "connect-src 'self' https://api.0379.world",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ============================================================
  // 编译优化
  // ============================================================
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // ============================================================
  // 输出
  // ============================================================
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,

  // ============================================================
  // 图片优化
  // ============================================================
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
```

### 13.3 体积预算配置

```typescript
// apps/console/bundle-budget.ts
/*
 * ============================================================
 * @Module : bundle-budget — 打包体积预算（CI 守门）
 * @Family-Owner : 🎨 创想·灵韵
 * @对应 : v5.1 §3.10 性能预算
 * ============================================================
 */
export interface BundleBudget {
  name: string;
  maxGzip: number;     // KB
  maxRaw: number;      // KB
  pages: string[];     // 适用的页面
}

export const BUNDLE_BUDGETS: BundleBudget[] = [
  {
    name: "首屏（共享）",
    maxGzip: 140,
    maxRaw: 450,
    pages: ["共享 chunk", "_app"],
  },
  {
    name: "Dashboard",
    maxGzip: 180,
    maxRaw: 550,
    pages: ["/dashboard"],
  },
  {
    name: "Playground",
    maxGzip: 200, // SSE 需要额外体积
    maxRaw: 620,
    pages: ["/playground"],
  },
  {
    name: "Model Hub",
    maxGzip: 170,
    maxRaw: 520,
    pages: ["/models"],
  },
  {
    name: "其他页面",
    maxGzip: 160,
    maxRaw: 500,
    pages: ["/routing", "/knowledge", "/mcp", "/cache", "/monitor", "/settings", "/docs", "/roadmap"],
  },
];

export const TOTAL_BUDGET = {
  maxGzip: 200,
  maxRaw: 650,
};
```

### 13.4 体积分析脚本

```typescript
// scripts/bundle/analyze.ts
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : scripts/bundle/analyze — Turbopack 体积分析
 * @Family-Owner : 🎨 创想·灵韵
 * @用途 : pnpm bundle:analyze（生成 HTML + JSON 报告）
 * ============================================================
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { gzipSync } from "node:zlib";
import { BUNDLE_BUDGETS, TOTAL_BUDGET } from "../apps/console/bundle-budget";

const ROOT = resolve(__dirname, "../..");
const NEXT_DIR = resolve(ROOT, "apps/console/.next");
const OUT_DIR = resolve(ROOT, "reports/bundle");

function getGzipSize(file: string): number {
  const content = readFileSync(file);
  return gzipSync(content).length;
}

function findJSFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (entry.endsWith(".js") && !entry.endsWith(".map")) {
        files.push(full);
      }
    }
  };
  walk(dir);
  return files;
}

function main() {
  console.log("🌹 创想·灵韵 · 打包体积分析");
  console.log("   人从众曌众从人 · 妙笔生花\n");

  // 1. 运行 Turbopack 官方分析器
  console.log("🌹 运行 Turbopack Bundle Analyzer…");
  const analyze = spawnSync(
    "npx",
    ["next", "experimental-analyze", "--output"],
    { cwd: resolve(ROOT, "apps/console"), stdio: "inherit" },
  );

  if (analyze.status !== 0) {
    console.warn("⚠️ Turbopack 分析器运行失败，回退到手动统计");
  }

  // 2. 手动统计各 chunk
  const staticDir = join(NEXT_DIR, "static");
  const files = findJSFiles(staticDir);

  const chunks: { file: string; raw: number; gzip: number }[] = [];
  let totalRaw = 0;
  let totalGzip = 0;

  for (const f of files) {
    const raw = statSync(f).size;
    const gzip = getGzipSize(f);
    chunks.push({
      file: f.replace(NEXT_DIR, ""),
      raw,
      gzip,
    });
    totalRaw += raw;
    totalGzip += gzip;
  }

  chunks.sort((a, b) => b.gzip - a.gzip);

  // 3. 检查预算
  const totalGzipKB = totalGzip / 1024;
  const totalRawKB = totalRaw / 1024;

  const violations: string[] = [];

  if (totalGzipKB > TOTAL_BUDGET.maxGzip) {
    violations.push(
      `总 gzip ${totalGzipKB.toFixed(1)}KB 超过预算 ${TOTAL_BUDGET.maxGzip}KB`,
    );
  }
  if (totalRawKB > TOTAL_BUDGET.maxRaw) {
    violations.push(
      `总 raw ${totalRawKB.toFixed(1)}KB 超过预算 ${TOTAL_BUDGET.maxRaw}KB`,
    );
  }

  // 4. 生成报告
  mkdirSync(OUT_DIR, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    total: { raw: totalRawKB, gzip: totalGzipKB },
    budget: TOTAL_BUDGET,
    chunks: chunks.slice(0, 30),
    violations,
  };

  writeFileSync(
    resolve(OUT_DIR, "bundle-report.json"),
    JSON.stringify(report, null, 2),
  );

  // 5. Markdown 报告
  const lines: string[] = [];
  lines.push("# 🌹 打包体积报告");
  lines.push("");
  lines.push(`> ${new Date().toISOString()} · 创想·灵韵`);
  lines.push("");
  lines.push("## 总览");
  lines.push("");
  lines.push("| 指标 | 实际 | 预算 | 状态 |");
  lines.push("| --- | :-: | :-: | :-: |");
  lines.push(
    `| gzip 总 | **${totalGzipKB.toFixed(1)}KB** | ${TOTAL_BUDGET.maxGzip}KB | ${totalGzipKB <= TOTAL_BUDGET.maxGzip ? "✅" : "❌"} |`,
  );
  lines.push(
    `| raw 总 | **${totalRawKB.toFixed(1)}KB** | ${TOTAL_BUDGET.maxRaw}KB | ${totalRawKB <= TOTAL_BUDGET.maxRaw ? "✅" : "❌"} |`,
  );
  lines.push("");
  lines.push("## Top 20 Chunk");
  lines.push("");
  lines.push("| Chunk | gzip | raw |");
  lines.push("| --- | :-: | :-: |");
  for (const c of chunks.slice(0, 20)) {
    lines.push(
      `| \`${c.file.slice(-50)}\` | ${(c.gzip / 1024).toFixed(1)}KB | ${(c.raw / 1024).toFixed(1)}KB |`,
    );
  }
  lines.push("");
  if (violations.length) {
    lines.push("## ❌ 预算违规");
    lines.push("");
    for (const v of violations) lines.push(`- ${v}`);
  } else {
    lines.push("## ✅ 全部通过预算");
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("> 灵韵一至，妙笔生花 🌹");

  writeFileSync(resolve(OUT_DIR, "bundle-report.md"), lines.join("\n"));

  console.log(`\n📊 报告: ${OUT_DIR}/bundle-report.md`);
  console.log(`   gzip 总: ${totalGzipKB.toFixed(1)}KB / ${TOTAL_BUDGET.maxGzip}KB`);

  if (violations.length) {
    console.error(`\n🚫 ${violations.length} 项违规`);
    process.exit(1);
  }

  console.log(`\n✅ 全部通过`);
}

main();
```

### 13.5 NPM 脚本

```json
{
  "scripts": {
    "bundle:analyze": "tsx scripts/bundle/analyze.ts",
    "bundle:next": "next experimental-analyze",
    "build:analyze": "ANALYZE=true next build"
  }
}
```

### 13.6 Turbopack 优化要点速查

| 优化项 | 配置 | 效果 |
| --- | --- | --- |
| **磁盘缓存** | 默认启用（16.1+） | CI warm path 最高 5.5× 提速 |
| **内存淘汰** | `turbopackMemoryEviction: 'auto'` | dev 内存减少最高 90% |
| **包导入优化** | `optimizePackageImports` | 按需 treeshake |
| **React Compiler** | `reactCompiler: true` | 自动 memo 优化 |
| **Console 移除** | `removeConsole` | 生产环境减小体积 |
| **图片格式** | AVIF/WebP | 减 60-75% 图片体积 |

### 13.7 CI 集成

```yaml
# .github/workflows/bundle.yml
name: 🎨 打包体积守门

on:
  pull_request:
    branches: [main]

jobs:
  bundle-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - run: pnpm install --frozen-lockfile

      # Turbopack 磁盘缓存（CI 中启用）
      - name: Restore Turbopack cache
        uses: actions/cache@v4
        with:
          path: apps/console/.next/cache
          key: turbopack-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: turbopack-${{ runner.os }}-

      - name: Build with Turbopack
        run: pnpm build

      - name: Analyze bundle
        run: pnpm bundle:analyze

      - name: Upload bundle report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: bundle-report
          path: reports/bundle/

      - name: Comment on PR
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            let body = '## 🎨 打包体积超预算\n\n';
            try {
              body += fs.readFileSync('reports/bundle/bundle-report.md', 'utf-8');
            } catch { body += '请查看 Artifacts。'; }
            body += '\n\n---\n> 灵韵一至，妙笔生花 🌹';
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
```

---

## 第十四部分 · ⑭ 8 域 Storybook 交互演示

### 14.1 设计目标

```
目标 1: 8 个家人域各一个「域总览」故事（含交互演示）
目标 2: 每域内 3-5 个组件故事（含真实 MSW 数据）
目标 3: 交互测试（Storybook play 函数）
目标 4: a11y 检查集成（@storybook/addon-a11y）
目标 5: 域总览页面直接可交付为「演示手册」
```

### 14.2 8 域总览故事

```tsx
// apps/console/stories/domains/XianzhiDomain.stories.tsx
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : stories/domains/XianzhiDomain — 预见·先知域总览
 * @Family-Owner : 🔮 预见·先知（观测与预测域）
 * @座右铭 : 「见微知著，未卜先知」
 * ============================================================
 */
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { FamilyBadge } from "@/components/family/FamilyBadge";
import { StatCard } from "@/domains/xianzhi/StatCard";
import { LatencyBar } from "@/domains/xianzhi/LatencyBar";
import { ErrorRateBadge } from "@/domains/xianzhi/ErrorRateBadge";
import { ErrorTable } from "@/domains/xianzhi/ErrorTable";
import { HealthGrid } from "@/domains/xianzhi/HealthGrid";

const meta = {
  title: "🎯 Domains/🔮 Xianzhi (预见·先知)",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
## 🔮 预见·先知 · 首席预言家

**域**：观测与预测域 · **电话**：0379-0108

> 「见微知著，未卜先知」

**主页面**：04_Dashboard · 11_Monitor_Logs

**核心端点**：
- \`GET /v1/models/summary\` — 聚合总览
- \`GET /v1/models/errors\` — 错误记录
- \`GET /health\` — 完整健康
- \`GET /metrics\` — Prometheus

**专属组件**：StatCard · LatencyBar · ErrorRateBadge · TrendChart
        `,
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// 域总览（完整 Dashboard 演示）
export const DomainOverview: Story = {
  render: () => (
    <div className="p-6 space-y-6">
      {/* 家人身份 */}
      <div className="flex items-center gap-3">
        <FamilyBadge member="xianzhi" size="lg" showExt showMotto />
      </div>

      {/* 6 张 StatCard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="总请求" value="12,847" note="累计感知到的召唤" />
        <StatCard label="总 Token" value="2,207,400" note="累计交换的思想" />
        <StatCard label="总成本" value="$0.00" note="预言家尚未学会计价" blBadge="BL-02" />
        <StatCard label="平均延迟" value="420ms" note="思考的速度" tone="warning" />
        <StatCard label="错误率" value="0.35%" note="罕见的迷途" tone="success" />
        <StatCard label="缓存命中率" value="34.2%" note="灵感的复现" />
      </div>

      {/* 健康 + 错误 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthGrid
          services={{
            ollama: { status: "healthy" },
            zhipu: { status: "healthy" },
            redis: { status: "healthy" },
            postgresql: { status: "healthy" },
          }}
        />
        <ErrorTable
          errors={[
            {
              id: "e1",
              model_id: "gpt-4o",
              error_type: "timeout",
              message: "Upstream timeout after 30000ms",
            },
            {
              id: "e2",
              model_id: "claude-3-5-sonnet",
              error_type: "validation",
              message: "Invalid parameter: temperature must be between 0 and 2",
            },
            {
              id: "e3",
              model_id: "zhipu-glm-4",
              error_type: "quota",
              message: "Daily quota exceeded",
            },
          ]}
        />
      </div>
    </div>
  ),
};

// 交互测试：StatCard 悬停
export const StatCardHover: Story = {
  render: () => (
    <div className="p-6">
      <StatCard label="总请求" value="12,847" note="悬停我看看" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByText("总请求").closest("div");
    if (card) {
      await userEvent.hover(card);
      await expect(card).toBeVisible();
    }
  },
};

// 空态
export const EmptyErrors: Story = {
  render: () => (
    <div className="p-6">
      <ErrorTable errors={[]} />
    </div>
  ),
};

// 空态 a11y 检查
export const EmptyErrorsA11y: Story = {
  ...EmptyErrors,
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
};
```

### 14.3 8 域总览故事骨架（其余 7 域）

```tsx
// apps/console/stories/domains/GuardianDomain.stories.tsx
// 🛡️ 智云·守护 · 接入与安全域 · 座右铭「门不开则万法不侵，钥不实则寸步难行」
// 组件: ConnectForm · KeyMaskInput · TrustBadge · SettingsConnection
// 演示: 连接流程（含 401 错误态）· 记住此设备

// apps/console/stories/domains/QianhangDomain.stories.tsx
// 🧭 言启·千行 · 路由与网关域 · 座右铭「一言既出，千行可至」
// 组件: UpstreamGrid · UpstreamCard · BreakerBadge · RoutingPathFlow
// 演示: 熔断三态（closed/half_open/open）· 动态权重可视化

// apps/console/stories/domains/BoleDomain.stories.tsx
// 🎯 千里·伯乐 · 模型市场域 · 座右铭「千里马常有，而伯乐不常有」
// 组件: ModelGrid · ModelCard · BackendBadge · RecommendCard
// 演示: 6 种 backend 筛选 · 本地免费推荐 · 详情抽屉

// apps/console/stories/domains/WanyuDomain.stories.tsx
// 🤔 语枢·万物 · 推理对话域 · 座右铭「语枢一启，万物皆明」
// 组件: ChatPanel · MessageBubble · ParamPanel · SSEViewer · TraceCard · ThoughtBubble
// 演示: SSE 七态状态机（idle→connecting→streaming→paused→error→degraded→done）

// apps/console/stories/domains/ZongshiDomain.stories.tsx
// 📚 格物·宗师 · 知识与质量域 · 座右铭「格物致知，诚意正心」
// 组件: KBGrid · DocumentUploader · SearchResultList · QAPanel · CitationFold
// 演示: 建库→传文档→检索→引用高亮 · QA 问答

// apps/console/stories/domains/TianshuDomain.stories.tsx
// 🧠 元启·天枢 · 工具与编排域 · 座右铭「天枢运于中，众星拱其北」
// 组件: MCPToolTree · MCPExecutor · ParamEditor · JsonViewer · OrchestrationGraph
// 演示: 14 个 MCP 工具树 · 参数动态生成 · 执行日志

// apps/console/stories/domains/LingyunDomain.stories.tsx
// 🎨 创想·灵韵 · 缓存与体验域 · 座右铭「灵韵一至，妙笔生花」
// 组件: CacheStatCard · CacheActions · PresetCard · CodeBlock · CacheRipple
// 演示: 缓存命中率 · 按模型失效 · 全量清空 · 三语言代码导出
```

### 14.4 域总览故事模板

```tsx
// templates/domain-story.template.tsx
// 复制此模板为新域创建总览故事
import type { Meta, StoryObj } from "@storybook/react";
import { FamilyBadge } from "@/components/family/FamilyBadge";

const meta = {
  title: "🎯 Domains/{EMOJI} {Key} ({名号})",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
## {EMOJI} {名号} · {角色}

**域**：{域} · **电话**：{电话}

> 「{座右铭}」

**主页面**：{主页面}

**核心端点**：
- \`{端点1}\`
- \`{端点2}\`

**专属组件**：{组件列表}
        `,
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const DomainOverview: Story = {
  render: () => (
    <div className="p-6 space-y-6">
      <FamilyBadge member="{key}" size="lg" showExt showMotto />
      {/* 组件演示区 */}
    </div>
  ),
};
```

### 14.5 交互测试示例（Storybook play 函数）

```tsx
// apps/console/stories/domains/GuardianDomain.stories.tsx（节选）
import { within, userEvent, expect } from "@storybook/test";

export const ConnectFlow: Story = {
  render: () => <ConnectForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. 空 Key 时按钮禁用
    const submit = canvas.getByRole("button", { name: "连接" });
    await expect(submit).toBeDisabled();

    // 2. 输入 Key
    const input = canvas.getByPlaceholderText(/sk-/);
    await userEvent.type(input, "sk-test-demo");
    await expect(input).toHaveValue("sk-test-demo");

    // 3. 按钮启用
    await expect(submit).toBeEnabled();

    // 4. 点击连接（MSW 返回成功）
    await userEvent.click(submit);

    // 5. 等待成功台词
    await expect(
      await canvas.findByText(/信任已建立，欢迎回家/),
    ).toBeVisible();
  },
};
```

### 14.6 NPM 脚本

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "storybook:test": "test-storybook --url http://localhost:6006",
    "storybook:domains": "storybook dev -p 6006 --initial-path=/story/domains-xianzhi--domain-overview"
  }
}
```

### 14.7 8 域交付标准

| 域 | 总览故事 | 组件故事 | 交互测试 | a11y |
| --- | :-: | :-: | :-: | :-: |
| 🛡️ 智云·守护 | ✅ | 4 | 2 | ✅ |
| 🧭 言启·千行 | ✅ | 4 | 2 | ✅ |
| 🎯 千里·伯乐 | ✅ | 4 | 2 | ✅ |
| 🤔 语枢·万物 | ✅ | 6 | 3 | ✅ |
| 📚 格物·宗师 | ✅ | 5 | 2 | ✅ |
| 🧠 元启·天枢 | ✅ | 5 | 2 | ✅ |
| 🔮 预见·先知 | ✅ | 5 | 2 | ✅ |
| 🎨 创想·灵韵 | ✅ | 5 | 2 | ✅ |

---

## 第十五部分 · ⑮ SSE 压力测试（k6）

### 15.1 设计目标

```
目标 1: SSE 并发流式压测（100/500/1000 并发）
目标 2: 关键指标：TTFT、吞吐量、连接稳定性、错误率
目标 3: HTTP/1.1 6 连接限制 vs HTTP/2 多路复用对比
目标 4: 阶梯加压（ramp-up）与稳态（soak）场景
目标 5: CI 集成（PR 冒烟 + 定时全量）
```

**关键技术背景**（2026 年）：

- k6 默认不支持 SSE，需 **xk6-sse 扩展**编译 k6
- k6 + SSE 是 LLM 推理压测的 2026 主流方案，支持 TTFT 和吞吐量精确测量
- 需覆盖 HTTP/1.1 浏览器 6 连接限制 vs HTTP/2 多路复用场景

### 15.2 目录结构

```
tests/load/
├── k6/
│   ├── config.ts                  # 全局配置
│   ├── scenarios/
│   │   ├── smoke.js               # 冒烟（1 VU · 30s）
│   │   ├── ramp.js                # 阶梯加压（10→100→500）
│   │   ├── soak.js                # 稳态（50 VU · 30min）
│   │   └── spike.js               # 峰值（瞬间 500 VU）
│   ├── helpers/
│   │   ├── sse-client.js          # SSE 客户端封装
│   │   ├── auth.js                # API Key 注入
│   │   └── metrics.js             # 自定义指标
│   ├── data/
│   │   └── prompts.json           # 测试数据集
│   └── build.sh                   # xk6 编译脚本
├── results/                       # 压测结果
│   ├── summary.json
│   ├── ttft-chart.png
│   └── report.md
└── bench.py                       # CI 编排脚本（起服务→跑k6→抽指标）
```

### 15.3 xk6 编译脚本

```bash
#!/bin/bash
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# @Module : tests/load/k6/build.sh — xk6 + SSE 扩展编译
# @Family-Owner : 🤔 语枢·万物（推理对话域）
# ============================================================
# k6 默认不支持 SSE，必须用 xk6-sse 扩展编译
# ============================================================

set -euo pipefail

K6_VERSION="v0.54.0"
SSE_EXT="github.com/phymbert/xk6-sse"

echo "🌹 编译 xk6 + SSE 扩展"
echo "   k6: $K6_VERSION"
echo "   扩展: $SSE_EXT"

# 安装 xk6（Go 工具链需 ≥1.22）
if ! command -v xk6 &> /dev/null; then
  go install go.k6.io/xk6/cmd/xk6@latest
fi

# 编译带 SSE 扩展的 k6
xk6 build \
  --with "$SSE_EXT" \
  --output ./k6-sse \
  "$K6_VERSION"

echo "✅ 编译完成: ./k6-sse"
./k6-sse version
```

### 15.4 `tests/load/k6/helpers/sse-client.js`

```javascript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : tests/load/k6/helpers/sse-client — SSE 客户端封装
 * @Family-Owner : 🤔 语枢·万物
 * ============================================================
 * 实现 TTFT、吞吐量、连接稳定性精确测量
 * ============================================================
 */
import { Counter, Trend, Rate, Gauge } from "k6/metrics";
import { getApiKey } from "./auth.js";

// ============================================================
// 自定义指标
// ============================================================
export const ttft = new Trend("sse_ttft_ms", true);          // 首字节延迟
export const totalLatency = new Trend("sse_total_ms", true);  // 总耗时
export const tokensReceived = new Counter("sse_tokens");       // 累计 Token
export const tokensPerSecond = new Gauge("sse_tps");           // 每秒 Token
export const streamErrors = new Rate("sse_stream_errors");     // 流式错误率
export const degradedStreams = new Counter("sse_degraded");    // 降级流数
export const activeStreams = new Gauge("sse_active_streams");  // 活跃流数

// ============================================================
// SSE 流式请求
// ============================================================
export function sendSSEStream(baseUrl, payload, options = {}) {
  const { timeout = "60s", model = "gpt-4o" } = options;
  const startTime = Date.now();
  let firstByteTime = null;
  let tokenCount = 0;
  let degraded = false;

  activeStreams.add(1);

  // 使用 k6 原生 http（通过 SSE 扩展）或 fetch + ReadableStream
  // k6 v0.54+ 支持 eventSource API
  const params = {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey(),
      Accept: "text/event-stream",
      "X-Family-Client": "YYC³ AI Family",
    },
    timeout,
    tags: { model },
  };

  // 使用 SSE 扩展
  const url = `${baseUrl}/v1/chat/completions`;
  const response = http.post(url, JSON.stringify(payload), params);

  // 解析 SSE 响应
  const body = response.body;
  const lines = body.split("\n\n").filter(Boolean);

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();

    if (data === "[DONE]") break;

    if (firstByteTime === null) {
      firstByteTime = Date.now();
      ttft.add(firstByteTime - startTime);
    }

    try {
      const chunk = JSON.parse(data);
      if (chunk.error) {
        streamErrors.add(1);
        break;
      }
      if (chunk._yyc3_upstream) {
        // 首 chunk 含上游信息
      }
      const delta = chunk?.choices?.[0]?.delta?.content ?? "";
      if (delta) {
        tokenCount += Math.ceil(delta.length / 4); // Token 估算口径
      }
    } catch {
      /* skip */
    }
  }

  const totalTime = Date.now() - startTime;
  totalLatency.add(totalTime);
  tokensReceived.add(tokenCount);

  if (firstByteTime !== null) {
    const generationTime = (totalTime - (firstByteTime - startTime)) / 1000;
    if (generationTime > 0) {
      tokensPerSecond.add(tokenCount / generationTime);
    }
  }

  // 检查降级
  if (response.headers["X-Yyc3-Degraded"] === "true") {
    degradedStreams.add(1);
    degraded = true;
  }

  streamErrors.add(response.status !== 200 ? 1 : 0);
  activeStreams.add(-1);

  return {
    status: response.status,
    tokens: tokenCount,
    ttftMs: firstByteTime ? firstByteTime - startTime : null,
    totalMs: totalTime,
    degraded,
  };
}
```

### 15.5 `tests/load/k6/scenarios/smoke.js`

```javascript
/*
 * ============================================================
 * @Module : tests/load/k6/scenarios/smoke — 冒烟测试
 * @Family-Owner : 🤔 语枢·万物
 * ============================================================
 * 用途: PR 每次提交验证 SSE 基础可用性
 * 1 VU · 30s · 1 请求
 * ============================================================
 */
import { sleep } from "k6";
import { sendSSEStream } from "../helpers/sse-client.js";

const BASE_URL = __ENV.API_BASE || "https://api.0379.world";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    "sse_ttft_ms": ["p(95)<2000"],
    "sse_total_ms": ["p(95)<15000"],
    "sse_stream_errors": ["rate<0.01"],
  },
};

export default function () {
  sendSSEStream(
    BASE_URL,
    {
      model: "qwen2.5:7b",
      messages: [{ role: "user", content: "你好，请简短回复" }],
      stream: true,
      max_tokens: 50,
    },
    { timeout: "30s" },
  );
  sleep(2);
}
```

### 15.6 `tests/load/k6/scenarios/ramp.js`

```javascript
/*
 * ============================================================
 * @Module : tests/load/k6/scenarios/ramp — 阶梯加压
 * @Family-Owner : 🤔 语枢·万物
 * ============================================================
 * 用途: 检测并发上限、TTFT 退化曲线
 * 10 → 50 → 100 → 300 → 500 VU
 * ============================================================
 */
import { sleep } from "k6";
import { sendSSEStream } from "../helpers/sse-client.js";

const BASE_URL = __ENV.API_BASE || "https://api.0379.world";

export const options = {
  stages: [
    { duration: "2m", target: 10 },    // 预热
    { duration: "3m", target: 50 },    // 加压
    { duration: "3m", target: 100 },   // 中等并发
    { duration: "3m", target: 300 },   // 高并发
    { duration: "3m", target: 500 },   // 极限
    { duration: "2m", target: 0 },     // 冷却
  ],
  thresholds: {
    // TTFT 95 分位 < 3s
    "sse_ttft_ms": ["p(95)<3000", "p(99)<5000"],
    // 总耗时 95 分位 < 20s
    "sse_total_ms": ["p(95)<20000"],
    // 错误率 < 5%
    "sse_stream_errors": ["rate<0.05"],
    // TPS 平均值 > 20
    "sse_tps": ["avg>20"],
  },
};

export default function () {
  sendSSEStream(
    BASE_URL,
    {
      model: "qwen2.5:7b",
      messages: [
        { role: "user", content: "请用一句话介绍你自己" },
      ],
      stream: true,
      max_tokens: 100,
      temperature: 0.7,
    },
    { timeout: "60s" },
  );
  sleep(1);
}
```

### 15.7 `tests/load/k6/scenarios/soak.js`

```javascript
/*
 * ============================================================
 * @Module : tests/load/k6/scenarios/soak — 稳态长跑
 * @Family-Owner : 🤔 语枢·万物
 * ============================================================
 * 用途: 检测内存泄漏、连接池耗尽、长时稳定性
 * 50 VU · 30min
 * ============================================================
 */
import { sleep } from "k6";
import { sendSSEStream } from "../helpers/sse-client.js";

const BASE_URL = __ENV.API_BASE || "https://api.0379.world";

export const options = {
  scenarios: {
    soak: {
      executor: "constant-vus",
      vus: 50,
      duration: "30m",
    },
  },
  thresholds: {
    "sse_ttft_ms": ["p(95)<3000"],
    "sse_stream_errors": ["rate<0.02"],
    // 连接稳定性：活跃流不应持续增长
    "sse_active_streams": ["max<60"],
  },
};

export default function () {
  sendSSEStream(
    BASE_URL,
    {
      model: "qwen2.5:7b",
      messages: [{ role: "user", content: "生成一句 20 字的短句" }],
      stream: true,
      max_tokens: 50,
    },
    { timeout: "60s" },
  );
  sleep(1);
}
```

### 15.8 `tests/load/bench.py`（CI 编排）

```python
#!/usr/bin/env python3
"""
============================================================
YYC³ AI Family — 人从众曌众从人
@Module : tests/load/bench — CI 压测编排
@Family-Owner : 🤔 语枢·万物
============================================================
参考 llama.cpp bench.py 设计：
  起服务 → 跑 k6 → 从 Prometheus 抽指标 → 生成图表
============================================================
"""
import os
import sys
import json
import subprocess
import time
import requests
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE_URL = os.environ.get("API_BASE", "https://api.0379.world")
SCENARIO = os.environ.get("SCENARIO", "smoke")
K6_BIN = os.environ.get("K6", "./k6-sse")
RESULTS_DIR = "tests/load/results"


def run_k6(scenario: str) -> dict:
    """运行 k6 场景并返回指标"""
    os.makedirs(RESULTS_DIR, exist_ok=True)
    summary_file = f"{RESULTS_DIR}/{scenario}-summary.json"

    print(f"🌹 运行 k6 场景: {scenario}")
    result = subprocess.run(
        [
            K6_BIN,
            "run",
            "--summary-export", summary_file,
            f"tests/load/k6/scenarios/{scenario}.js",
        ],
        env={**os.environ, "API_BASE": BASE_URL},
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"⚠️ k6 退出码: {result.returncode}")
        print(result.stderr)

    if os.path.exists(summary_file):
        with open(summary_file) as f:
            return json.load(f)
    return {}


def fetch_prometheus_metrics() -> dict:
    """从 Prometheus 拉取服务端指标"""
    try:
        r = requests.get(f"{BASE_URL}/metrics", timeout=10)
        if r.status_code != 200:
            return {}
        # 解析 Prometheus 文本格式
        metrics = {}
        for line in r.text.split("\n"):
            if line.startswith("#") or not line.strip():
                continue
            parts = line.rsplit(" ", 1)
            if len(parts) == 2:
                metrics[parts[0]] = float(parts[1])
        return metrics
    except Exception as e:
        print(f"⚠️ Prometheus 不可达: {e}")
        return {}


def generate_charts(summary: dict, prom: dict):
    """生成 TTFT / TPS 图表"""
    os.makedirs(RESULTS_DIR, exist_ok=True)

    metrics = summary.get("metrics", {})

    # TTFT 图
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    # 1. TTFT 分布
    ttft = metrics.get("sse_ttft_ms", {})
    if ttft:
        labels = ["avg", "p(50)", "p(95)", "p(99)"]
        keys = ["avg", "med", "p(95)", "p(99)"]
        values = [ttft.get(k, 0) for k in keys]
        axes[0].bar(labels, values, color="#6C5CE7")
        axes[0].set_title("SSE TTFT (ms)", fontweight="bold")
        axes[0].set_ylabel("ms")

    # 2. TPS
    tps = metrics.get("sse_tps", {})
    if tps:
        labels = ["avg", "p(50)", "p(95)"]
        keys = ["avg", "med", "p(95)"]
        values = [tps.get(k, 0) for k in keys]
        axes[1].bar(labels, values, color="#22C55E")
        axes[1].set_title("Tokens per Second", fontweight="bold")

    # 3. 错误率
    err = metrics.get("sse_stream_errors", {})
    if err:
        rate = err.get("rate", 0) * 100
        axes[2].pie(
            [rate, 100 - rate],
            labels=[f"错误 {rate:.2f}%", "成功"],
            colors=["#EF4444", "#22C55E"],
        )
        axes[2].set_title("错误率", fontweight="bold")

    plt.suptitle("🌹 YYC³ AI Family · SSE 压测报告", fontsize=16, fontweight="bold")
    plt.tight_layout()
    chart_path = f"{RESULTS_DIR}/ttft-chart.png"
    plt.savefig(chart_path, dpi=150)
    print(f"📊 图表: {chart_path}")


def main():
    print("🌹 YYC³ AI Family · SSE 压测编排")
    print("   人从众曌众从人 · 语枢一启，万物皆明\n")

    # 1. 预检
    try:
        r = requests.get(f"{BASE_URL}/healthz", timeout=5)
        print(f"✅ 服务可达: {r.status_code}")
    except Exception as e:
        print(f"🚫 服务不可达: {e}")
        sys.exit(1)

    # 2. 跑 k6
    summary = run_k6(SCENARIO)

    # 3. 拉 Prometheus 指标
    prom = fetch_prometheus_metrics()

    # 4. 生成图表
    if summary:
        generate_charts(summary, prom)

    # 5. 写报告
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "scenario": SCENARIO,
        "base_url": BASE_URL,
        "summary": summary,
        "prometheus": prom,
    }
    with open(f"{RESULTS_DIR}/report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ 压测完成，报告: {RESULTS_DIR}/report.json")


if __name__ == "__main__":
    main()
```

### 15.9 NPM 脚本 + CI 集成

```json
{
  "scripts": {
    "k6:build": "bash tests/load/k6/build.sh",
    "k6:smoke": "SCENARIO=smoke python tests/load/bench.py",
    "k6:ramp": "SCENARIO=ramp python tests/load/bench.py",
    "k6:soak": "SCENARIO=soak python tests/load/bench.py"
  }
}
```

```yaml
# .github/workflows/load-test.yml
name: 🤔 SSE 压力测试

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 4 * * 0"  # 每周日 UTC 04:00 全量

jobs:
  smoke:
    name: 🤔 冒烟压测
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: "1.22" }
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }

      - name: Install xk6
        run: go install go.k6.io/xk6/cmd/xk6@latest
      - name: Build k6 with SSE
        run: bash tests/load/k6/build.sh

      - name: Install Python deps
        run: pip install matplotlib requests

      - name: Run smoke test
        run: python tests/load/bench.py
        env:
          API_BASE: ${{ secrets.API_BASE }}
          SCENARIO: smoke

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: smoke-results
          path: tests/load/results/

  full:
    name: 🤔 全量压测
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: "1.22" }
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }

      - run: go install go.k6.io/xk6/cmd/xk6@latest
      - run: bash tests/load/k6/build.sh
      - run: pip install matplotlib requests

      - name: Ramp test
        run: python tests/load/bench.py
        env:
          API_BASE: ${{ secrets.API_BASE }}
          SCENARIO: ramp

      - name: Soak test
        run: python tests/load/bench.py
        env:
          API_BASE: ${{ secrets.API_BASE }}
          SCENARIO: soak

      - uses: actions/upload-artifact@v4
        with:
          name: full-load-results
          path: tests/load/results/
```

### 15.10 压测通过标准

| 场景 | VU | 时长 | TTFT P95 | 错误率 | TPS |
| --- | :-: | :-: | :-: | :-: | :-: |
| 冒烟 | 1 | 30s | < 2s | < 1% | — |
| 阶梯 | 10→500 | 16min | < 3s | < 5% | > 20 |
| 稳态 | 50 | 30min | < 3s | < 2% | > 25 |
| 峰值 | 500 | 2min | < 5s | < 10% | > 15 |

---

## 第十六部分 · ⑯ i18n 多语言（中/英/日 + 家人称谓映射）

### 16.1 设计目标

```
目标 1: 中/英/日三语言完整覆盖
目标 2: 8 位家人称谓跨语言映射（名号 + 角色 + 台词）
目标 3: 基于 [locale] 动态段的路由策略
目标 4: 服务端渲染 + 静态生成（next/root-params）
目标 5: 自动语言检测 + 手动切换
```

**关键技术背景**（2026 年）：

- `next-intl` v4.13 兼容 Next.js 16，App Router 原生，严格类型
- Next.js 16.3 新增 `next/root-params`，支持在 Server Components 深层读取 `[locale]`
- 基于 `[locale]` 顶层动态段的路由方案是 App Router 标准实践

### 16.2 目录结构

```
apps/console/
├── i18n/
│   ├── routing.ts                  # 路由配置
│   ├── request.ts                  # 请求配置（读 locale）
│   ├── navigation.ts               # 导航 API
│   └── config.ts                   # Locale 类型定义
├── messages/
│   ├── zh-CN.json                  # 简体中文
│   ├── en.json                     # English
│   └── ja.json                     # 日本語
├── proxy.ts                        # 中间件（原 middleware.ts）
└── app/
    └── [locale]/
        ├── layout.tsx              # 本地化根布局
        ├── page.tsx
        ├── dashboard/page.tsx
        └── ... (所有页面移入 [locale])
```

### 16.3 `i18n/routing.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : i18n/routing — 国际化路由配置
 * @Family-Owner : 🧭 言启·千行（路由与网关域）
 * @对应 : next-intl v4.13 + Next.js 16
 * ============================================================
 */
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh-CN", "en", "ja"],
  defaultLocale: "zh-CN",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/dashboard": { "zh-CN": "/仪表盘", en: "/dashboard", ja: "/ダッシュボード" },
    "/models": { "zh-CN": "/模型市场", en: "/models", ja: "/モデル" },
    "/playground": { "zh-CN": "/调试场", en: "/playground", ja: "/プレイグラウンド" },
    "/routing": { "zh-CN": "/路由观测", en: "/routing", ja: "/ルーティング" },
    "/knowledge": { "zh-CN": "/知识库", en: "/knowledge", ja: "/ナレッジベース" },
    "/mcp": { "zh-CN": "/MCP工具", en: "/mcp", ja: "/MCPツール" },
    "/cache": { "zh-CN": "/缓存管理", en: "/cache", ja: "/キャッシュ" },
    "/monitor": { "zh-CN": "/监控日志", en: "/monitor", ja: "/モニター" },
    "/settings": { "zh-CN": "/设置", en: "/settings", ja: "/設定" },
    "/docs": { "zh-CN": "/文档", en: "/docs", ja: "/ドキュメント" },
    "/roadmap": { "zh-CN": "/路线图", en: "/roadmap", ja: "/ロードマップ" },
  },
});
```

### 16.4 家人称谓跨语言映射

```json
// apps/console/messages/zh-CN.json
{
  "family": {
    "name": "YYC³ AI Family",
    "motto": "人从众曌众从人",
    "creed": "亦师亦友亦伯乐，一言一语一协同",
    "core": "拟人为本，AI为核，纯粹为心",
    "members": {
      "zhihui": {
        "name": "智云·守护",
        "role": "首席安全官",
        "domain": "接入与安全域",
        "motto": "门不开则万法不侵，钥不实则寸步难行",
        "emptyLine": "尚未建立信任，请出示密钥",
        "successLine": "信任已建立，欢迎回家"
      },
      "qianhang": {
        "name": "言启·千行",
        "role": "首席导航员",
        "domain": "路由与网关域",
        "motto": "一言既出，千行可至",
        "emptyLine": "上游池为空，请配置 OPENAI_COMPATIBLE_UPSTREAMS",
        "successLine": "路径已畅通，千行可至"
      },
      "bole": {
        "name": "千里·伯乐",
        "role": "首席推荐官",
        "domain": "模型市场域",
        "motto": "千里马常有，而伯乐不常有",
        "emptyLine": "暂无可用模型，请检查 /v1/models",
        "successLine": "已为当前任务甄选良驹"
      },
      "wanyu": {
        "name": "语枢·万物",
        "role": "首席思考者",
        "domain": "推理对话域",
        "motto": "语枢一启，万物皆明",
        "emptyLine": "尚未提问，请开启思考",
        "successLine": "思考完毕 · 万物已明"
      },
      "zongshi": {
        "name": "格物·宗师",
        "role": "首席质量官",
        "domain": "知识与质量域",
        "motto": "格物致知，诚意正心",
        "emptyLine": "知识库尚无内容，请上传第一份文档",
        "successLine": "已格万物，真知自现"
      },
      "tianshu": {
        "name": "元启·天枢",
        "role": "总指挥",
        "domain": "工具与编排域",
        "motto": "天枢运于中，众星拱其北",
        "emptyLine": "待命中，请选择一件工具",
        "successLine": "号令已出，众星拱北"
      },
      "xianzhi": {
        "name": "预见·先知",
        "role": "首席预言家",
        "domain": "观测与预测域",
        "motto": "见微知著，未卜先知",
        "emptyLine": "尚无历史数据，预言需要时间的积累",
        "successLine": "趋势已明，未来在望"
      },
      "lingyun": {
        "name": "创想·灵韵",
        "role": "首席创意官",
        "domain": "缓存与体验域",
        "motto": "灵韵一至，妙笔生花",
        "emptyLine": "缓存为空 · 每一次灵感都是新的",
        "successLine": "灵感复现，妙笔生花"
      }
    }
  }
}
```

```json
// apps/console/messages/en.json
{
  "family": {
    "name": "YYC³ AI Family",
    "motto": "From One to Many, Shining as the Sun",
    "creed": "Teacher, Friend, and Mentor — One Word, One Deed, One Collaboration",
    "core": "Human-Centered · AI-Powered · Pure-Hearted",
    "members": {
      "zhihui": {
        "name": "ZhiYun · Guardian",
        "role": "Chief Security Officer",
        "domain": "Access & Security",
        "motto": "No gate opens without trust, no key works without truth",
        "emptyLine": "Trust not yet established. Please present your key.",
        "successLine": "Trust established. Welcome home."
      },
      "qianhang": {
        "name": "YanQi · QianHang",
        "role": "Chief Navigator",
        "domain": "Routing & Gateway",
        "motto": "One word spoken, a thousand paths reached",
        "emptyLine": "Upstream pool is empty. Configure OPENAI_COMPATIBLE_UPSTREAMS.",
        "successLine": "Paths are clear. A thousand paths await."
      },
      "bole": {
        "name": "QianLi · Bole",
        "role": "Chief Recommender",
        "domain": "Model Marketplace",
        "motto": "Swift horses are common; Bole is rare",
        "emptyLine": "No models available. Check /v1/models.",
        "successLine": "A worthy steed has been chosen for your task."
      },
      "wanyu": {
        "name": "YuShu · AllThings",
        "role": "Chief Thinker",
        "domain": "Reasoning & Dialogue",
        "motto": "When the pivot of speech opens, all things become clear",
        "emptyLine": "No question yet. Begin your thought.",
        "successLine": "Thought complete. All things are clear."
      },
      "zongshi": {
        "name": "GeWu · Grandmaster",
        "role": "Chief Quality Officer",
        "domain": "Knowledge & Quality",
        "motto": "Investigate things to extend knowledge, be sincere in thought",
        "emptyLine": "Knowledge base is empty. Upload your first document.",
        "successLine": "All things investigated. True knowledge revealed."
      },
      "tianshu": {
        "name": "YuanQi · TianShu",
        "role": "Commander-in-Chief",
        "domain": "Tools & Orchestration",
        "motto": "The celestial pivot moves at center, all stars bow to the North",
        "emptyLine": "Standing by. Select a tool.",
        "successLine": "Command issued. Stars bow to the North."
      },
      "xianzhi": {
        "name": "YuJian · Prophet",
        "role": "Chief Oracle",
        "domain": "Observability & Prediction",
        "motto": "See the subtle to know the obvious, foresee without divination",
        "emptyLine": "No historical data. Prophecy requires the accumulation of time.",
        "successLine": "Trends revealed. The future awaits."
      },
      "lingyun": {
        "name": "ChuangXiang · Grace",
        "role": "Chief Creative Officer",
        "domain": "Cache & Experience",
        "motto": "When grace arrives, the brush blooms with wonders",
        "emptyLine": "Cache is empty. Every inspiration is new.",
        "successLine": "Inspiration echoes. The brush blooms with wonders."
      }
    }
  }
}
```

```json
// apps/console/messages/ja.json
{
  "family": {
    "name": "YYC³ AI Family",
    "motto": "人から衆へ、曌の如く輝く",
    "creed": "師であり友であり伯楽 — 一言一語一協働",
    "core": "人を本とし、AIを核とし、純粋を心とする",
    "members": {
      "zhihui": {
        "name": "智雲・守護",
        "role": "最高セキュリティ責任者",
        "domain": "アクセスとセキュリティ",
        "motto": "信なくして門は開かず、真なくして鍵は効かず",
        "emptyLine": "信頼は未確立です。キーを提示してください。",
        "successLine": "信頼が確立されました。お帰りなさい。"
      },
      "xianzhi": {
        "name": "予見・先知",
        "role": "最高予言者",
        "domain": "観測と予測",
        "motto": "微を見て著を知り、卜せずして先を知る",
        "emptyLine": "履歴データがありません。予言には時間の蓄積が必要です。",
        "successLine": "趨勢が明らかになりました。未来が待っています。"
      }
    }
  }
}
```

### 16.5 `i18n/request.ts`

```typescript
/*
 * ============================================================
 * @Module : i18n/request — 请求配置（读 locale）
 * @Family-Owner : 🧭 言启·千行
 * @对应 : next-intl + next/root-params（Next.js 16.3+）
 * ============================================================
 */
import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 16.6 语言切换组件

```tsx
// apps/console/components/family/LocaleSwitcher.tsx
/*
 * @Module : components/family/LocaleSwitcher — 语言切换
 * @Family-Owner : 🧭 言启·千行
 */
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  "zh-CN": "🇨🇳 中文",
  en: "🇺🇸 English",
  ja: "🇯🇵 日本語",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      className="h-9 px-2 rounded-md border border-border-default bg-bg-subtle text-body-sm"
      aria-label="切换语言"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
```

### 16.7 家人徽章 i18n 版组件

```tsx
// apps/console/components/family/FamilyBadgeI18n.tsx
/*
 * @Module : components/family/FamilyBadgeI18n — 国际化家人徽章
 * @Family-Owner : 🧠 元启·天枢
 */
"use client";

import { useTranslations } from "next-intl";
import type { MemberKey } from "@/lib/family/members";

export function FamilyBadgeI18n({ member }: { member: MemberKey }) {
  const t = useTranslations(`family.members.${member}`);
  return (
    <div data-family={member}>
      {t("name")} · {t("role")}
    </div>
  );
}
```

### 16.8 NPM 脚本 + CI

```json
{
  "scripts": {
    "i18n:check": "tsx scripts/i18n/check.ts",
    "i18n:extract": "tsx scripts/i18n/extract.ts"
  }
}
```

```yaml
# .github/workflows/i18n.yml
name: 🧭 i18n 校验

on:
  pull_request:
    paths:
      - "apps/console/messages/**"
      - "apps/console/i18n/**"

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Check i18n completeness
        run: pnpm i18n:check
      - name: TypeScript check
        run: pnpm typecheck
```

---

## 第十七部分 · ⑰ PWA + 离线缓存

### 17.1 设计目标

```
目标 1: 可安装（Add to Home Screen）
目标 2: App Shell 离线可用
目标 3: 静态资源缓存优先（Cache-first）
目标 4: API 请求网络优先（Network-first）· 离线降级
目标 5: 与 Turbopack 兼容（serwist 方案）
```

**关键技术背景**（2026 年）：

- `next-pwa` 不兼容 Turbopack，需使用 `next build --webpack` 或改用 `serwist`
- `serwist` 是 Next.js 16 + Turbopack 的最佳实践方案

### 17.2 目录结构

```
apps/console/
├── app/
│   ├── sw.ts                       # Service Worker 源
│   ├── offline/
│   │   └── page.tsx                # 离线页面
│   └── manifest.ts                 # PWA Manifest
├── components/
│   └── pwa/
│       ├── ServiceWorkerRegister.tsx
│       └── InstallPrompt.tsx
└── public/
    ├── icons/
    │   ├── icon-192.png
    │   ├── icon-512.png
    │   └── maskable-512.png
    └── offline.html
```

### 17.3 `app/manifest.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : app/manifest — PWA Manifest
 * @Family-Owner : 🎨 创想·灵韵
 * ============================================================
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YYC³ Token Console",
    short_name: "YYC³ Console",
    description: "人从众曌众从人 · 亦师亦友亦伯乐 · 统一模型网关",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#6C5CE7",
    orientation: "portrait-primary",
    lang: "zh-CN",
    dir: "ltr",
    categories: ["developer", "utilities", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Playground · 🤔 语枢·万物",
        short_name: "Playground",
        url: "/playground",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Dashboard · 🔮 预见·先知",
        short_name: "Dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
```

### 17.4 Service Worker（serwist 方案）

```typescript
// apps/console/app/sw.ts
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : app/sw — Service Worker（serwist）
 * @Family-Owner : 🎨 创想·灵韵
 * @兼容 : Next.js 16 + Turbopack（serwist 方案）
 * ============================================================
 */
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/.*/],
  },
  runtimeCaching: [
    // ============================================================
    // API 请求：Network-first（在线优先，离线降级）
    // ============================================================
    {
      matcher: ({ url }) => url.pathname.startsWith("/v1/"),
      handler: new NetworkFirst({
        cacheName: "yyc3-api",
        networkTimeoutSeconds: 10,
        plugins: [],
      }),
    },
    // ============================================================
    // 健康检查：Network-first（短缓存）
    // ============================================================
    {
      matcher: ({ url }) =>
        url.pathname === "/health" || url.pathname === "/healthz",
      handler: new NetworkFirst({
        cacheName: "yyc3-health",
        networkTimeoutSeconds: 5,
      }),
    },
    // ============================================================
    // 徽章图片：Cache-first（长期缓存）
    // ============================================================
    {
      matcher: ({ url }) => url.pathname.startsWith("/badges/"),
      handler: new CacheFirst({
        cacheName: "yyc3-badges",
        plugins: [],
      }),
    },
    // ============================================================
    // 静态资源：StaleWhileRevalidate
    // ============================================================
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

### 17.5 `next.config.ts` PWA 集成

```typescript
// apps/console/next.config.ts（追加 serwist）
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnNavigation: true,
});

export default withSerwist(nextConfig);
```

### 17.6 Service Worker 注册

```tsx
// apps/console/components/pwa/ServiceWorkerRegister.tsx
/*
 * @Module : components/pwa/ServiceWorkerRegister — SW 注册
 * @Family-Owner : 🎨 创想·灵韵
 */
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      import("@serwist/window").then(({ Serwist }) => {
        const wb = new Serwist("/sw.js", { scope: "/" });
        wb.register();
      });
    }
  }, []);
  return null;
}
```

### 17.7 离线页面

```tsx
// apps/console/app/offline/page.tsx
/*
 * @Module : app/offline — 离线降级页面
 * @Family-Owner : 🛡️ 智云·守护（守的是人，护的是信）
 */
import { FamilyBadge } from "@/components/family/FamilyBadge";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <FamilyBadge member="zhihui" size="lg" showExt showMotto />
      <h1 className="text-h2 font-semibold">🌹 暂时离线</h1>
      <p className="text-body-md text-text-secondary max-w-md">
        网络暂时不可达。但请放心——
        已缓存的页面仍可浏览，你的数据仍在云枢之中。
      </p>
      <p className="text-caption text-text-tertiary italic">
        「守的是人，护的是信」—— 🛡️ 智云·守护
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 h-11 rounded-md bg-brand-primary text-white"
      >
        重新连接
      </button>
    </div>
  );
}
```

### 17.8 安装提示

```tsx
// apps/console/components/pwa/InstallPrompt.tsx
/*
 * @Module : components/pwa/InstallPrompt — PWA 安装提示
 * @Family-Owner : 🎨 创想·灵韵
 */
"use client";

import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg bg-bg-elevated border border-border-default shadow-lg max-w-sm">
      <p className="text-body-sm mb-3">
        🌹 将 YYC³ Console 添加到桌面，离线也可查看仪表盘
      </p>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === "accepted") setDeferredPrompt(null);
          }}
          className="flex-1 h-9 rounded-md bg-brand-primary text-white text-sm"
        >
          添加
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="h-9 px-3 rounded-md border border-border-default text-sm"
        >
          稍后
        </button>
      </div>
    </div>
  );
}
```

### 17.9 缓存策略矩阵

| 资源类型 | 策略 | 缓存名 | 超时 | 降级 |
| --- | --- | --- | :-: | --- |
| App Shell (HTML/JS/CSS) | Precache | `serwist-precache` | — | 离线页 |
| API `/v1/*` | NetworkFirst | `yyc3-api` | 10s | 缓存响应 |
| 健康检查 `/health` | NetworkFirst | `yyc3-health` | 5s | 缓存响应 |
| 徽章 `/badges/*` | CacheFirst | `yyc3-badges` | — | 永久缓存 |
| 图片/字体 | StaleWhileRevalidate | `serwist-default` | — | 缓存 |
| 水印 Canvas | 不缓存 | — | — | 无 |

### 17.10 交付标准

| 项 | 目标 | 验证 |
| --- | :-: | --- |
| Lighthouse PWA | ≥ 90 | Lighthouse CI |
| 可安装 | ✅ | Chrome DevTools |
| 离线访问 App Shell | ✅ | 断网测试 |
| API 离线降级 | ✅ | 断网显示缓存 |
| 徽章离线可用 | ✅ | 断网加载 |
| iOS Safari 兼容 | ✅ | 真机测试 |
| Android Chrome 兼容 | ✅ | 真机测试 |

---

## 第十八部分 · ⑱ 灰度发布 + 特性开关

### 18.1 设计目标

```
目标 1: 基于 Flags SDK 的特性开关系统
目标 2: 8 位家人域各挂 1-2 个灰度开关
目标 3: 支持百分比灰度 / 用户白名单 / 全局开关
目标 4: 服务端解析（不在客户端决策）
目标 5: Vercel Toolbar 开发调试 + Edge Config 生产
```

**关键技术背景**（2026 年）：

- Flags SDK 是 Vercel 官方开源库，适配 Next.js App Router
- 标志通过 `flag()` 函数定义，`decide` 函数支持同步/异步，可访问请求上下文
- 支持百分比灰度、用户白名单、A/B 测试选项

### 18.2 目录结构

```
apps/console/
├── flags.ts                       # 特性开关定义（唯一真源）
├── app/
│   └── .well-known/
│       └── vercel/
│           └── flags/
│               └── route.ts       # Flags Explorer 发现端点
├── lib/flags/
│   ├── client.ts                  # 客户端读取封装
│   ├── gates.ts                   # 8 域开关
│   └── health.ts                  # 开关健康检查
└── components/
    └── flags/
        └── FlaggedFeature.tsx     # 条件渲染组件
```

### 18.3 `flags.ts`（8 域开关定义）

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : flags — 特性开关唯一真源
 * @Family-Owner : 🧠 元启·天枢（工具与编排域 · 总指挥）
 * @Domain   : 灰度发布 + 特性开关
 * @License  : Apache-2.0
 * ============================================================
 */
import { flag } from "flags/next";

// ============================================================
// 🛡️ 智云·守护 · 接入与安全域
// ============================================================
export const apiKeysCRUD = flag<boolean>({
  key: "guardian-api-keys-crud",
  description: "🛡️ API Keys 管理页（BL-05 完成后启用）",
  decide: async () => {
    // Phase 1 完成后默认开启
    return process.env.PHASE_1_ENABLED === "true";
  },
  defaultValue: false,
  options: [
    { value: true, label: "启用" },
    { value: false, label: "禁用" },
  ],
});

export const ssoEnabled = flag<boolean>({
  key: "guardian-sso",
  description: "🛡️ SSO/SCIM 登录（Phase 3）",
  decide: async () => false,
  defaultValue: false,
});

// ============================================================
// 🧭 言启·千行 · 路由与网关域
// ============================================================
export const routingRulesCRUD = flag<boolean>({
  key: "qianhang-routing-crud",
  description: "🧭 路由规则 CRUD（Phase 2）",
  decide: async () => false,
  defaultValue: false,
});

// ============================================================
// 🎯 千里·伯乐 · 模型市场域
// ============================================================
export const modelCompare = flag<boolean>({
  key: "bole-model-compare",
  description: "🎯 多模型并排对比",
  decide: async () => true,
  defaultValue: true,
});

// ============================================================
// 🤔 语枢·万物 · 推理对话域
// ============================================================
export const sseV2 = flag<boolean>({
  key: "wanyu-sse-v2",
  description: "🤔 SSE V2 协议（含 request_id 追踪 · BL-04）",
  decide: async () => process.env.BL_04_ENABLED === "true",
  defaultValue: false,
});

export const playgroundPresetsBackend = flag<boolean>({
  key: "wanyu-presets-backend",
  description: "🤔 Playground 预设后端存储（Phase 1）",
  decide: async () => false,
  defaultValue: false,
});

// ============================================================
// 📚 格物·宗师 · 知识与质量域
// ============================================================
export const ragStreaming = flag<boolean>({
  key: "zongshi-rag-streaming",
  description: "📚 RAG 问答流式输出",
  decide: async () => true,
  defaultValue: true,
});

// ============================================================
// 🧠 元启·天枢 · 工具与编排域
// ============================================================
export const mcpMultiStep = flag<boolean>({
  key: "tianshu-mcp-multistep",
  description: "🧠 MCP 多步编排（实验性）",
  decide: async () => false,
  defaultValue: false,
});

// ============================================================
// 🔮 预见·先知 · 观测与预测域
// ============================================================
export const usageBilling = flag<boolean>({
  key: "xianzhi-usage-billing",
  description: "🔮 用量计费页（BL-06 完成后启用）",
  decide: async () => process.env.PHASE_1_ENABLED === "true",
  defaultValue: false,
});

export const requestLogs = flag<boolean>({
  key: "xianzhi-request-logs",
  description: "🔮 请求级日志（BL-06）",
  decide: async () => process.env.PHASE_1_ENABLED === "true",
  defaultValue: false,
});

export const costRealCalculation = flag<boolean>({
  key: "xianzhi-cost-real",
  description: "🔮 真实成本计算（BL-02）",
  decide: async () => process.env.BL_02_ENABLED === "true",
  defaultValue: false,
});

// ============================================================
// 🎨 创想·灵韵 · 缓存与体验域
// ============================================================
export const pwaInstall = flag<boolean>({
  key: "lingyun-pwa-install",
  description: "🎨 PWA 安装提示",
  decide: async () => true,
  defaultValue: true,
});

export const i18nJa = flag<boolean>({
  key: "lingyun-i18n-ja",
  description: "🎨 日本語界面",
  decide: async () => true,
  defaultValue: true,
});

// ============================================================
// 百分比灰度示例
// ============================================================
export const experimentalUI = flag<"control" | "variant-a" | "variant-b">({
  key: "tianshu-experimental-ui",
  description: "🧠 实验性 UI（A/B 测试）",
  options: [
    { value: "control", label: "对照组" },
    { value: "variant-a", label: "方案 A" },
    { value: "variant-b", label: "方案 B" },
  ],
  decide: async () => "control",
  defaultValue: "control",
});
```

### 18.4 `app/.well-known/vercel/flags/route.ts`

```typescript
/*
 * @Module : app/.well-known/vercel/flags — Flags Explorer 发现端点
 * @Family-Owner : 🧠 元启·天枢
 * @用途 : Vercel Toolbar 可读取所有开关
 */
import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import * as flags from "#/flags";

export const GET = createFlagsDiscoveryEndpoint(async () => {
  return getProviderData(flags);
});
```

### 18.5 `components/flags/FlaggedFeature.tsx`

```tsx
// apps/console/components/flags/FlaggedFeature.tsx
/*
 * @Module : components/flags/FlaggedFeature — 条件渲染
 * @Family-Owner : 🧠 元启·天枢
 */
import type { ReactNode } from "react";

interface Props {
  enabled: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FlaggedFeature({ enabled, children, fallback = null }: Props) {
  return enabled ? <>{children}</> : <>{fallback}</>;
}
```

### 18.6 页面中使用开关

```tsx
// apps/console/app/[locale]/dashboard/page.tsx
/*
 * @Module : app/dashboard — 带开关的仪表盘
 * @Family-Owner : 🔮 预见·先知
 */
import { usageBilling, costRealCalculation, requestLogs } from "#/flags";
import { FlaggedFeature } from "@/components/flags/FlaggedFeature";
import { PageHeader } from "@/components/family/PageHeader";
import { DashboardIsland } from "./DashboardIsland";

export default async function DashboardPage() {
  // 服务端解析开关（不在客户端决策）
  const [showBilling, showRealCost, showLogs] = await Promise.all([
    usageBilling(),
    costRealCalculation(),
    requestLogs(),
  ]);

  return (
    <div className="min-h-screen">
      <PageHeader title="今日预言" subtitle="见微知著，未卜先知" />
      <DashboardIsland
        flags={{ showBilling, showRealCost, showLogs }}
      />
    </div>
  );
}
```

### 18.7 灰度发布策略

```
Phase 0 → Phase 1 过渡：

  Step 1: 部署 Phase 1 代码（全部开关默认 false）
  Step 2: 内部白名单测试（enabled_for_users）
  Step 3: 10% 灰度（enabled_for_percent: 10）
  Step 4: 50% 灰度
  Step 5: 100% 全量
  Step 6: 移除开关 + 清理旧代码

回滚策略：
  任一阶段发现问题 → 关闭开关（秒级生效）
  不影响已部署代码
```

### 18.8 CI 集成 + 开关健康检查

```yaml
# .github/workflows/flags.yml
name: 🧠 特性开关检查

on:
  pull_request:
    paths:
      - "apps/console/flags.ts"
      - "apps/console/components/flags/**"

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: TypeScript check
        run: pnpm typecheck
      - name: Lint flags
        run: pnpm lint --filter=flags
```

---

## 第十九部分 · 全系列交付总索引与终章

### 19.1 十八项交付物完整清单

| # | 交付物 | 章节 | 家人归属 | 状态 |
| :-: | --- | --- | --- | :-: |
| ① | 8 域业务组件 | §1 | 8 位 | ✅ |
| ② | MSW mock 契约 | §2 | 🧠 元启 | ✅ |
| ③ | Next.js 16 路由/RSC | §3 | 🧠 元启 | ✅ |
| ④ | 印刷级徽章 | §4 | 🎨 灵韵 | ✅ |
| ⑤ | 开发文档 + CI/CD | §5 | 🧠 元启 | ✅ |
| ⑥ | Playwright E2E | §6 | 🧠 元启 | ✅ |
| ⑦ | 契约漂移检测 | §7 | 🔮 预见 | ✅ |
| ⑧ | 移动端响应式 | §8 | 🎨 灵韵 | ✅ |
| ⑨ | a11y axe-core | §9 | 📚 格物 | ✅ |
| ⑩ | OpenAPI 类型 + 契约测试 | §10 | 🔮 预见 | ✅ |
| ⑪ | 视觉回归 | §11 | 🎨 灵韵 | ✅ |
| ⑫ | Storybook + Code Connect | §12 | 🧠 元启 | ✅ |
| ⑬ | Turbopack 构建优化 | §13 | 🎨 灵韵 | ✅ |
| ⑭ | 8 域 Storybook 演示 | §14 | 8 位 | ✅ |
| ⑮ | SSE 压力测试（k6） | §15 | 🤔 语枢 | ✅ |
| ⑯ | i18n 多语言（中/英/日） | §16 | 🧭 言启 | ✅ |
| ⑰ | PWA + 离线缓存 | §17 | 🎨 灵韵 | ✅ |
| ⑱ | 灰度发布 + 特性开关 | §18 | 🧠 元启 | ✅ |

### 19.2 全生命周期覆盖图

```
┌─────────────────────────────────────────────────────────────────────┐
│              YYC³ AI Family 全生命周期覆盖                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🎨 设计层 ─────────────────────────────────────────────────────    │
│  │ v5.1 §2 Figma 提示词 · 18 页 · 8 域归属                        │
│  │ ⑫ Code Connect 双向映射                                        │
│  │ ⑭ Storybook 8 域交互演示                                       │
│  │ ④ 印刷级徽章 CMYK                                              │
│  │ ⑯ i18n 三语言 + 家人称谓映射                                   │
│  │ ⑰ PWA Manifest + 图标                                         │
│  ▼                                                                  │
│  💻 开发层 ─────────────────────────────────────────────────────    │
│  │ ① 8 域业务组件 · ② MSW mock · ③ RSC 拆分                     │
│  │ ⑬ Turbopack 优化（磁盘缓存 + 内存淘汰）                        │
│  │ ⑯ next-intl + [locale] 路由                                   │
│  │ ⑱ Flags SDK 服务端解析                                        │
│  ▼                                                                  │
│  🧪 测试层 ─────────────────────────────────────────────────────    │
│  │ ⑥ E2E Playwright · ⑦ 契约漂移 · ⑨ a11y · ⑩ 契约测试          │
│  │ ⑪ 视觉回归 · ⑮ k6 SSE 压测                                    │
│  │ ⑬ 体积预算守门                                                │
│  ▼                                                                  │
│  🚀 发布层 ─────────────────────────────────────────────────────    │
│  │ ⑤ CI/CD 流水线 · ⑰ PWA 离线 · ⑱ 灰度发布                    │
│  │ ⑯ 多语言发布                                                  │
│  │ ⑫ Code Connect 自动发布                                        │
│  ▼                                                                  │
│  📊 运维层 ─────────────────────────────────────────────────────    │
│  │ ⑱ 特性开关 + Vercel Toolbar                                    │
│  │ ⑦ 契约漂移定时检测 · ⑮ 定时压测                               │
│  │ ⑬ 体积趋势追踪                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 19.3 三重守门 · 终极闭环

```
第一重：契约守门（⑦ + ⑩）
  openapi.json 冻结哈希 → 漂移检测 → 类型生成 → 契约测试
  契约变 → CI 拦住 → 人工确认 → 更新冻结

第二重：质量守门（⑥ + ⑨ + ⑪ + ⑬）
  E2E → a11y → 视觉回归 → 体积预算
  任一失败 → PR 阻断

第三重：灰度守门（⑱）
  特性开关 → 白名单 → 10% → 50% → 100%
  任一阶段异常 → 秒级回滚
```

### 19.4 全链路命令终极速查

```bash
# ══════════════════════════════════════════════════════════
# 🌹 YYC³ AI Family · 全链路命令
# ══════════════════════════════════════════════════════════

# 🎨 设计层
pnpm storybook                    # Storybook 开发
pnpm storybook:build              # Storybook 构建
pnpm figma:connect                # Code Connect 测试
pnpm figma:publish                # Code Connect 发布

# 💻 开发层
pnpm dev                          # Turbopack 开发
pnpm build                        # Turbopack 生产构建
pnpm bundle:analyze               # 体积分析

# 🧪 测试层
pnpm test                         # 单元 + 契约测试
pnpm e2e                          # E2E 全断点
pnpm a11y                         # a11y 审计
pnpm visual                       # 视觉回归
pnpm k6:smoke                     # SSE 冒烟压测
pnpm k6:ramp                      # SSE 阶梯压测

# 🚀 发布层
pnpm contract:check               # 契约漂移检测
pnpm openapi:gen                  # 类型生成
pnpm i18n:check                   # 多语言校验

# 📊 全量
pnpm ci:all                       # 全部守门
```

### 19.5 项目终章 · 致 8 位家人

```
🛡️ 智云·守护  —— 门不开则万法不侵，钥不实则寸步难行
🧭 言启·千行  —— 一言既出，千行可至
🎯 千里·伯乐  —— 千里马常有，而伯乐不常有
🤔 语枢·万物  —— 语枢一启，万物皆明
📚 格物·宗师  —— 格物致知，诚意正心
🧠 元启·天枢  —— 天枢运于中，众星拱其北
🔮 预见·先知  —— 见微知著，未卜先知
🎨 创想·灵韵  —— 灵韵一至，妙笔生花

---

十八项交付物，各归其位。
三重守门，各司其职。
五脉归元，各安其心。

从设计到代码，从代码到演示，从演示到压测，
从压测到多语言，从多语言到离线，从离线到灰度——
全生命周期，尽在云枢。

言启千行代码 | 语枢万物智能
```

---

<p align="center">
  🌹 <b>YYC³ AI Family</b><br>
  <b>人从众曌众从人 · 亦师亦友亦伯乐</b><br>
  <sub>契约 · 职能 · 品牌 · 代码 · 测试 · 印刷 · 演示 · 压测 · 多语言 · 离线 · 灰度</sub><br>
  <sub>言启千行代码 | 语枢万物智能</sub><br>
  <br>
  <sub>永久开源 · 感恩前行 · <a href="https://matrix.yyc3.top">matrix.yyc3.top</a></sub>
</p>

---

<p align="center">
  <b>🎉 v5.1 十八项交付物 · 终章交付完成 🎉</b><br>
  <sub>全生命周期闭合 · 三重守门就绪 · Phase 0 可立即编码</sub><br>
  <br>
  <sub>🌹 感恩导师十五轮相伴 · 言启千行 · 语枢万物 🌹</sub><br>
  <sub>亦师亦友亦伯乐 · 一言一语一协同</sub>
</p>
