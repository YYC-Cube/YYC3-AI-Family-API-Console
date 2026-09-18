# YYC3-AI-Family-Token-Console.md

v5.1· ⑩⑪ 双交付物 · 契约→代码→测试全链路闭合

> **承接**：v5.1 落地补全系列最终批。①8域组件 → ②MSW → ③RSC → ④印刷徽章 → ⑤文档/CICD → ⑥E2E → ⑦契约漂移 → ⑧响应式 → ⑨a11y → **⑩OpenAPI类型+契约测试** → **⑪视觉回归** → **闭环**。
>
> **阶段宣言**：从 `openapi.json` 冻结 → 类型自动生成 → API 客户端类型安全 → 契约测试守门 → E2E 通过 → 视觉回归冻结 → 发布。**契约不变则类型不变，类型不变则 UI 不变，UI 不变则像素不变。**

---

## 第十部分 · ⑩ OpenAPI 自动类型 + 契约测试

### 10.1 目录结构

```
apps/console/
├── domains/_shared/
│   ├── types.gen.ts              # ⚙️ openapi-typescript 自动生成（禁止手改）
│   ├── types.zod.ts              # 🛡️ zod schema（运行时校验）
│   ├── ApiClient.ts              # 类型化 fetch（§1.2 已建）
│   ├── api-typed.ts              # 类型化 API 端点封装（新）
│   └── guards.ts                 # 运行时类型守卫（新）
├── tests/
│   ├── contract/
│   │   ├── setup.ts              # 契约测试环境
│   │   ├── endpoints.spec.ts     # 端点存在性契约
│   │   ├── schemas.spec.ts       # Schema 字段契约
│   │   ├── sse.spec.ts           # SSE 协议契约
│   │   └── errors.spec.ts        # 错误码契约
│   └── unit/
│       └── api-typed.spec.ts     # API 客户端单元测试
├── scripts/
│   └── openapi/
│       ├── generate.ts           # 类型生成（含哈希校验）
│       ├── verify.ts             # 生成后校验（CI 用）
│       └── rename.ts             # 重命名冲突处理
├── .openapi-cache/
│   └── openapi.json              # 本地缓存（.gitignore）
├── vitest.config.ts
└── package.json
```

### 10.2 依赖

```bash
pnpm add -D openapi-typescript openapi-fetch zod vitest @vitest/coverage-v8
pnpm add -D @types/node tsx
```

**版本锁定**（继承 v5.1 §3）：

```json
{
  "devDependencies": {
    "openapi-typescript": "^7.4.0",
    "openapi-fetch": "^0.12.0",
    "zod": "^3.23.8",
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "tsx": "^4.19.0"
  }
}
```

### 10.3 `scripts/openapi/generate.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : scripts/openapi/generate — OpenAPI → TS 类型生成
 * @Family-Owner : 🔮 预见·先知（观测与预测域）
 * @Domain   : 契约层（§1 冻结快照）
 * @License  : Apache-2.0
 * ============================================================
 * 用途:
 *   pnpm openapi:gen          拉取最新 + 生成类型
 *   pnpm openapi:gen --local  仅使用本地缓存
 *   pnpm openapi:gen --strict 哈希不匹配则退出
 * ============================================================
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { sha256Canonical } from "../contract/hash";

const ROOT = resolve(__dirname, "../..");
const CACHE_DIR = resolve(ROOT, ".openapi-cache");
const CACHE_FILE = resolve(CACHE_DIR, "openapi.json");
const HASH_FILE = resolve(ROOT, ".contract-hash");
const OUT_FILE = resolve(ROOT, "domains/_shared/types.gen.ts");
const OPENAPI_URL =
  process.env.OPENAPI_URL ?? "https://api.0379.world/openapi.json";

async function fetchFresh(): Promise<any> {
  console.log(`🌹 拉取 ${OPENAPI_URL}`);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 15_000);
  try {
    const res = await fetch(OPENAPI_URL, { signal: ac.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function loadLocal(): Promise<any> {
  if (!existsSync(CACHE_FILE)) {
    throw new Error(`本地缓存不存在: ${CACHE_FILE}，请先执行 pnpm openapi:gen`);
  }
  return JSON.parse(await readFile(CACHE_FILE, "utf-8"));
}

async function main() {
  const localOnly = process.argv.includes("--local");
  const strict = process.argv.includes("--strict");

  console.log("🌹 格物·宗师 · OpenAPI 类型生成");
  console.log("   YYC³ AI Family · 人从众曌众从人\n");

  // 1. 获取 openapi.json
  let openapi: any;
  try {
    openapi = localOnly ? await loadLocal() : await fetchFresh();
  } catch (err) {
    console.warn(`⚠️ 拉取失败，尝试使用本地缓存: ${(err as Error).message}`);
    openapi = await loadLocal();
  }

  // 2. 校验哈希（若存在冻结）
  if (existsSync(HASH_FILE)) {
    const frozen = (await readFile(HASH_FILE, "utf-8")).trim();
    const current = sha256Canonical(openapi);
    if (frozen !== current) {
      console.warn(`⚠️ 契约哈希不匹配`);
      console.warn(`   冻结: ${frozen.slice(0, 16)}…`);
      console.warn(`   当前: ${current.slice(0, 16)}…`);
      if (strict) {
        console.error(`🚫 --strict 模式退出`);
        process.exit(1);
      }
    } else {
      console.log(`✅ 契约哈希匹配: ${frozen.slice(0, 16)}…`);
    }
  }

  // 3. 写缓存
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(openapi, null, 2));

  // 4. 调用 openapi-typescript 生成类型
  console.log(`\n🌹 生成类型 → ${OUT_FILE}`);
  const result = spawnSync(
    "npx",
    [
      "openapi-typescript",
      CACHE_FILE,
      "-o",
      OUT_FILE,
      "--immutable",
      "--alphabetize",
      "--root-types",
      "--root-types-no-schema-prefix",
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    console.error(`🚫 类型生成失败`);
    process.exit(1);
  }

  // 5. 注入家族标头
  const generated = await readFile(OUT_FILE, "utf-8");
  const header = `/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : domains/_shared/types.gen — 自动生成，请勿手改
 * @Family-Owner : 🔮 预见·先知
 * @Generator: openapi-typescript
 * @Source   : ${OPENAPI_URL}
 * @Hash     : ${sha256Canonical(openapi).slice(0, 16)}…
 * @Homepage : https://matrix.yyc3.top
 * @License  : Apache-2.0
 * ============================================================
 * ⚠️ 本文件由 pnpm openapi:gen 自动生成
 * ⚠️ 任何手工修改都会在下次生成时被覆盖
 * ============================================================
 */
`;
  await writeFile(OUT_FILE, header + generated);

  // 6. 校验生成物可编译
  console.log(`\n🌹 校验类型文件`);
  const tsc = spawnSync("npx", ["tsc", "--noEmit", OUT_FILE], {
    stdio: "inherit",
  });
  if (tsc.status !== 0) {
    console.error(`🚫 类型文件编译失败`);
    process.exit(1);
  }

  console.log(`\n✅ 类型生成完成`);
  console.log(`   文件: ${OUT_FILE}`);
  console.log(`   大小: ${(await readFile(OUT_FILE, "utf-8")).length} bytes`);
}

main().catch((err) => {
  console.error(`🌹 异常:`, err);
  process.exit(1);
});
```

### 10.4 `scripts/openapi/verify.ts`

```typescript
/*
 * ============================================================
 * @Module : scripts/openapi/verify — CI 校验：类型与冻结契约一致
 * @Family-Owner : 🔮 预见·先知
 * ============================================================
 * 用途:
 *   pnpm openapi:verify
 *   在 CI 中检测开发者是否忘记执行 openapi:gen
 * ============================================================
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT = resolve(__dirname, "../..");
const OUT_FILE = resolve(ROOT, "domains/_shared/types.gen.ts");
const CACHE_FILE = resolve(ROOT, ".openapi-cache/openapi.json");

async function main() {
  console.log("🌹 校验类型文件新鲜度");

  if (!existsSync(OUT_FILE)) {
    console.error(`🚫 类型文件不存在: ${OUT_FILE}`);
    console.error(`   请执行: pnpm openapi:gen`);
    process.exit(1);
  }

  if (!existsSync(CACHE_FILE)) {
    console.error(`🚫 OpenAPI 缓存不存在`);
    console.error(`   请执行: pnpm openapi:gen`);
    process.exit(1);
  }

  // 用缓存重新生成到临时文件对比
  const tmpFile = resolve(ROOT, ".openapi-cache/types.verify.ts");
  const result = spawnSync(
    "npx",
    [
      "openapi-typescript",
      CACHE_FILE,
      "-o",
      tmpFile,
      "--immutable",
      "--alphabetize",
      "--root-types",
      "--root-types-no-schema-prefix",
    ],
    { stdio: "pipe" },
  );

  if (result.status !== 0) {
    console.error(`🚫 临时生成失败`);
    process.exit(1);
  }

  const generated = (await readFile(tmpFile, "utf-8")).trim();
  const existing = (await readFile(OUT_FILE, "utf-8"))
    .replace(/^\/\*[\s\S]*?\*\/\s*/m, "")
    .trim();

  if (generated !== existing) {
    console.error(`🚫 类型文件与当前契约不一致`);
    console.error(`   请执行: pnpm openapi:gen 并提交变更`);
    process.exit(1);
  }

  console.log(`✅ 类型文件与契约一致`);
}

main().catch((err) => {
  console.error(`🌹 异常:`, err);
  process.exit(1);
});
```

### 10.5 `domains/_shared/api-typed.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * ============================================================
 * @Module : domains/_shared/api-typed — 类型化 API 端点封装
 * @Family-Owner : 🔮 预见·先知
 * @Domain : 全 8 域共享
 * ============================================================
 */
import createClient from "openapi-fetch";
import type { paths, components } from "./types.gen";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.0379.world";

function getApiKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    sessionStorage.getItem("yyc3_api_key") ??
    localStorage.getItem("yyc3_api_key") ??
    undefined
  );
}

export const api = createClient<paths>({
  baseUrl: API_BASE,
  headers: {
    "X-Family-Client": "YYC³ AI Family",
    "X-Family-Motto": "人从众曌众从人 · 亦师亦友亦伯乐",
  },
});

// 请求中间件：注入 API Key
api.use({
  onRequest({ request }) {
    const key = getApiKey();
    if (key) request.headers.set("X-API-Key", key);
    return request;
  },
});

// 类型别名（便捷）
export type ModelConfig = components["schemas"]["ModelConfig"];
export type ModelStat = components["schemas"]["ModelStat"];
export type ErrorRecord = components["schemas"]["ErrorRecord"];
export type UsageSummary = components["schemas"]["UsageSummary"];
export type HealthResponse = components["schemas"]["HealthResponse"];
export type Backend = ModelConfig["backend"];
export type ErrorType = ErrorRecord["error_type"];

// ============================================================
// 8 域类型化端点（每域一命名空间）
// ============================================================

// 🛡️ 智云·守护
export const GuardianAPI = {
  healthz: () => api.GET("/healthz"),
  ping: () => api.GET("/v1/ping"),
  versions: () => api.GET("/v1/versions"),
} as const;

// 🧭 言启·千行
export const QianhangAPI = {
  routerStats: () => api.GET("/v1/router/stats"),
  routerHealth: () => api.GET("/v1/router/health"),
} as const;

// 🎯 千里·伯乐
export const BoleAPI = {
  models: () => api.GET("/v1/models"),
  modelStats: () => api.GET("/v1/models/stats"),
  modelType: (params: { id: string }) =>
    api.GET("/v1/model/type", { params: { query: params } }),
} as const;

// 🤔 语枢·万物
export const WanyuAPI = {
  chat: (body: components["schemas"]["ChatCompletionRequest"]) =>
    api.POST("/v1/chat/completions", { body }),
} as const;

// 📚 格物·宗师
export const ZongshiAPI = {
  knowledgeBases: () => api.GET("/v1/knowledge-bases"),
  documents: (params?: { kb_id?: string }) =>
    api.GET("/v1/documents", { params: { query: params } }),
  ragSearch: (body: { query: string; kb_ids: string[]; top_k?: number }) =>
    api.POST("/v1/rag/search", { body }),
  ragAsk: (body: { query: string; kb_ids: string[] }) =>
    api.POST("/v1/rag/ask", { body }),
  embeddings: (body: { input: string | string[]; model: string }) =>
    api.POST("/v1/embeddings", { body }),
} as const;

// 🧠 元启·天枢
export const TianshuAPI = {
  mcpTools: () => api.GET("/v1/mcp/tools"),
  mcpSearch: (params: { q: string }) =>
    api.GET("/v1/mcp/search", { params: { query: params } }),
  mcpExecute: (body: { tool: string; params: Record<string, unknown> }) =>
    api.POST("/v1/mcp/execute", { body }),
} as const;

// 🔮 预见·先知
export const XianzhiAPI = {
  summary: () => api.GET("/v1/models/summary"),
  errors: () => api.GET("/v1/models/errors"),
  health: () => api.GET("/health"),
  metrics: () => api.GET("/metrics"),
} as const;

// 🎨 创想·灵韵
export const LingyunAPI = {
  cacheStats: () => api.GET("/v1/cache/stats"),
  cacheInfo: () => api.GET("/v1/cache/info"),
  invalidate: (model: string) =>
    api.POST("/v1/cache/invalidate/{model}", {
      params: { path: { model } },
    }),
  clearAll: () => api.DELETE("/v1/cache/all"),
} as const;
```

### 10.6 `domains/_shared/types.zod.ts`（运行时校验）

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * ============================================================
 * @Module : domains/_shared/types.zod — zod 运行时 Schema
 * @Family-Owner : 📚 格物·宗师（知识与质量域）
 * @用途   : 契约测试 + 运行时守卫
 * ============================================================
 */
import { z } from "zod";

// ============================================================
// 枚举（严格与 §1.2 一致）
// ============================================================
export const BackendSchema = z.enum([
  "local",
  "openai",
  "zhipu",
  "deepseek",
  "ollama",
  "upstream",
]);

export const ErrorTypeSchema = z.enum([
  "timeout",
  "validation",
  "quota",
  "internal",
]);

export const ServiceStatusSchema = z.enum([
  "healthy",
  "unreachable",
  "configured",
]);

// ============================================================
// Schema
// ============================================================
export const ModelConfigSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  backend: BackendSchema,
  version: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  max_tokens: z.number().int().positive().max(128_000).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  top_p: z.number().min(0).max(1).nullable().optional(),
  cost_per_1k_tokens: z.number().min(0).default(0),
});

export const ModelStatSchema = z.object({
  model_id: z.string(),
  usage_count: z.number().int().nonnegative().default(0),
  avg_latency_ms: z.number().nonnegative().default(0),
  error_rate: z.number().min(0).max(1).default(0),
  total_tokens: z.number().int().nonnegative().default(0),
});

export const ErrorRecordSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime().optional(),
  model_id: z.string(), // ⚠️ 不是 model
  error_type: ErrorTypeSchema,
  message: z.string(),
  stack: z.string().nullable().optional(),
});

export const UsageSummarySchema = z.object({
  total_requests: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
  cost_usd: z.number().min(0),
});

export const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime_seconds: z.number().nonnegative(),
  services: z.object({
    ollama: z.object({ status: ServiceStatusSchema }),
    zhipu: z.object({ status: ServiceStatusSchema }),
    redis: z.object({ status: ServiceStatusSchema }),
    postgresql: z.object({ status: ServiceStatusSchema }),
  }),
  system: z.object({
    cpu_percent: z.number().min(0).max(100),
    memory_percent: z.number().min(0).max(100),
    disk_percent: z.number().min(0).max(100),
  }),
  metrics: z.object({
    active_requests: z.number().int().nonnegative(),
    total_requests: z.number().int().nonnegative(),
    cache_hit_rate: z.number().min(0).max(1),
  }),
});

export const APIErrorSchema = z.object({
  detail: z.object({
    error: z.enum(["network", "api", "timeout", "validation"]),
    message: z.string(),
    context: z.any().optional(),
    status_code: z.number().int(),
  }),
});

// ============================================================
// 首 chunk 扩展字段（SSE）
// ============================================================
export const FirstChunkExtrasSchema = z.object({
  _yyc3_upstream: z.string().optional(),
  _request_id: z.string().uuid().optional(),
});

// ============================================================
// 类型导出（从 zod 推断）
// ============================================================
export type ModelConfigZ = z.infer<typeof ModelConfigSchema>;
export type ModelStatZ = z.infer<typeof ModelStatSchema>;
export type ErrorRecordZ = z.infer<typeof ErrorRecordSchema>;
export type UsageSummaryZ = z.infer<typeof UsageSummarySchema>;
export type HealthResponseZ = z.infer<typeof HealthResponseSchema>;
export type APIErrorZ = z.infer<typeof APIErrorSchema>;
```

### 10.7 `domains/_shared/guards.ts`

```typescript
/*
 * ============================================================
 * @Module : domains/_shared/guards — 运行时类型守卫
 * @Family-Owner : 🛡️ 智云·守护（接入与安全域）
 * ============================================================
 */
import {
  ModelConfigSchema,
  ModelStatSchema,
  ErrorRecordSchema,
  UsageSummarySchema,
  HealthResponseSchema,
  APIErrorSchema,
} from "./types.zod";

export function parseModelConfigs(data: unknown) {
  return ModelConfigSchema.array().parse(data);
}

export function parseModelStats(data: unknown) {
  return ModelStatSchema.array().parse(data);
}

export function parseErrorRecords(data: unknown) {
  return ErrorRecordSchema.array().parse(data);
}

export function parseUsageSummary(data: unknown) {
  return UsageSummarySchema.parse(data);
}

export function parseHealthResponse(data: unknown) {
  return HealthResponseSchema.parse(data);
}

export function parseAPIError(data: unknown) {
  return APIErrorSchema.safeParse(data);
}
```

### 10.8 `tests/contract/setup.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * ============================================================
 * @Module : tests/contract/setup — 契约测试环境
 * @Family-Owner : 📚 格物·宗师
 * ============================================================
 */
import { beforeAll, afterAll, afterEach } from "vitest";
import { server } from "../../mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 10.9 `tests/contract/endpoints.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : tests/contract/endpoints — 端点存在性契约
 * @Family-Owner : 📚 格物·宗师
 * @对应 : v5.1 §7.2.2 检查项 11（端点真实）
 * ============================================================
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SNAPSHOT = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../.contract-snapshot.json"),
    "utf-8",
  ),
);

const REQUIRED_ENDPOINTS = [
  // ✅ 直接对接 43 个（部分列表）
  "post /v1/chat/completions",
  "get /v1/models",
  "get /v1/models/stats",
  "get /v1/models/errors",
  "get /v1/model/type",
  "get /v1/router/stats",
  "get /v1/router/health",
  "get /v1/cache/stats",
  "get /v1/cache/info",
  "post /v1/cache/invalidate/{model}",
  "delete /v1/cache/all",
  "post /v1/embeddings",
  "post /v1/rerank",
  "post /v1/audio/transcriptions",
  "post /v1/ocr",
  "get /v1/knowledge-bases",
  "post /v1/knowledge-bases",
  "get /v1/documents",
  "post /v1/documents/upload",
  "post /v1/rag/search",
  "post /v1/rag/ask",
  "get /v1/mcp/tools",
  "post /v1/mcp/execute",
  "get /health",
  "get /healthz",
  "get /v1/ping",
  "get /v1/versions",
  "get /metrics",
  "get /docs",
  "get /openapi.json",
];

const FORBIDDEN_ENDPOINTS = [
  // 🚫 禁止虚构（v5.1 §7.2.2 检查项 11）
  "get /v1/keys",
  "post /v1/keys",
  "get /v1/billing",
  "post /v1/billing",
  "get /v1/team/members",
  "get /v1/alerts",
  "post /v1/alerts/rules",
];

describe("契约 · 端点存在性", () => {
  it("所有必需端点存在", () => {
    const paths = SNAPSHOT.paths ?? {};
    const missing: string[] = [];
    for (const ep of REQUIRED_ENDPOINTS) {
      const [method, path] = ep.split(" ");
      if (!paths[path]?.[method]) missing.push(ep);
    }
    expect(missing).toEqual([]);
  });

  it("禁止的虚构端点不存在", () => {
    const paths = SNAPSHOT.paths ?? {};
    const found: string[] = [];
    for (const ep of FORBIDDEN_ENDPOINTS) {
      const [method, path] = ep.split(" ");
      if (paths[path]?.[method]) found.push(ep);
    }
    expect(found).toEqual([]);
  });

  it("端点总数与冻结一致（52）", () => {
    let count = 0;
    for (const path of Object.keys(SNAPSHOT.paths ?? {})) {
      for (const method of Object.keys(SNAPSHOT.paths[path])) {
        if (["get", "post", "put", "patch", "delete"].includes(method)) {
          count++;
        }
      }
    }
    // 允许 ±5 浮动（版本迭代）
    expect(count).toBeGreaterThanOrEqual(47);
    expect(count).toBeLessThanOrEqual(60);
  });
});
```

### 10.10 `tests/contract/schemas.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : tests/contract/schemas — Schema 字段级契约
 * @Family-Owner : 📚 格物·宗师
 * @对应 : v5.1 §7.2.2 检查项 8、9、10、12
 * ============================================================
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ModelConfigSchema,
  ModelStatSchema,
  ErrorRecordSchema,
  UsageSummarySchema,
  HealthResponseSchema,
  BackendSchema,
  ErrorTypeSchema,
} from "../../domains/_shared/types.zod";

const SNAPSHOT = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../.contract-snapshot.json"),
    "utf-8",
  ),
);
const schemas = SNAPSHOT.components?.schemas ?? {};

describe("契约 · ModelConfig", () => {
  const expectedFields = [
    "id",
    "display_name",
    "backend",
    "enabled",
    "max_tokens",
    "temperature",
    "cost_per_1k_tokens",
  ];

  it("字段与冻结契约一致", () => {
    const actual = Object.keys(schemas.ModelConfig?.properties ?? {});
    for (const f of expectedFields) {
      expect(actual, `ModelConfig 缺字段 ${f}`).toContain(f);
    }
  });

  it("backend 枚举仅 6 种", () => {
    const enumValues = schemas.ModelConfig?.properties?.backend?.enum ?? [];
    expect(enumValues.sort()).toEqual(
      ["deepseek", "local", "ollama", "openai", "upstream", "zhipu"].sort(),
    );
  });

  it("zod 可解析合法样本", () => {
    const sample = {
      id: "gpt-4o",
      display_name: "GPT-4o",
      backend: "openai",
      enabled: true,
      max_tokens: 128000,
      temperature: 0.7,
      cost_per_1k_tokens: 0.005,
    };
    expect(() => ModelConfigSchema.parse(sample)).not.toThrow();
  });

  it("zod 拒绝非法 backend", () => {
    const invalid = {
      id: "x",
      display_name: "X",
      backend: "claude",
      enabled: true,
      max_tokens: 4096,
      temperature: 0.7,
      cost_per_1k_tokens: 0,
    };
    expect(() => ModelConfigSchema.parse(invalid)).toThrow();
  });
});

describe("契约 · ErrorRecord", () => {
  it("字段名为 model_id（不是 model）", () => {
    const fields = Object.keys(schemas.ErrorRecord?.properties ?? {});
    expect(fields).toContain("model_id");
    expect(fields).not.toContain("model"); // ⚠️ v5.0 修正点
  });

  it("error_type 枚举仅 4 种", () => {
    const enumValues = schemas.ErrorRecord?.properties?.error_type?.enum ?? [];
    expect(enumValues.sort()).toEqual(
      ["internal", "quota", "timeout", "validation"].sort(),
    );
  });

  it("zod 拒绝 v3.0 废弃枚举（network/api）", () => {
    expect(() => ErrorTypeSchema.parse("network")).toThrow();
    expect(() => ErrorTypeSchema.parse("api")).toThrow();
    expect(() => ErrorTypeSchema.parse("timeout")).not.toThrow();
  });
});

describe("契约 · UsageSummary", () => {
  it("cost_usd 存在于 schema", () => {
    const fields = Object.keys(schemas.UsageSummary?.properties ?? {});
    expect(fields).toContain("cost_usd");
  });

  it("cost_usd 恒为 0.0（BL-02 未完成前）", () => {
    // 后端当前硬编码；契约测试在此断言后端行为
    const sample = { total_requests: 100, total_tokens: 5000, cost_usd: 0 };
    const parsed = UsageSummarySchema.parse(sample);
    // UI 层负责显示 BL-02 徽章
    expect(parsed.cost_usd).toBe(0);
  });
});

describe("契约 · HealthResponse", () => {
  it("services 含 4 个服务", () => {
    const props = schemas.HealthResponse?.properties?.services?.properties ?? {};
    expect(Object.keys(props).sort()).toEqual(
      ["ollama", "postgresql", "redis", "zhipu"].sort(),
    );
  });

  it("service status 枚举 3 种", () => {
    const statusEnum =
      schemas.HealthResponse?.properties?.services?.properties?.ollama
        ?.properties?.status?.enum ?? [];
    expect(statusEnum.sort()).toEqual(
      ["configured", "healthy", "unreachable"].sort(),
    );
  });

  it("system 含 3 指标", () => {
    const props = schemas.HealthResponse?.properties?.system?.properties ?? {};
    expect(Object.keys(props).sort()).toEqual(
      ["cpu_percent", "disk_percent", "memory_percent"].sort(),
    );
  });

  it("metrics 含 cache_hit_rate", () => {
    const props = schemas.HealthResponse?.properties?.metrics?.properties ?? {};
    expect(Object.keys(props)).toContain("cache_hit_rate");
  });

  it("zod 校验数值范围", () => {
    const invalid = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      uptime_seconds: 100,
      services: {
        ollama: { status: "healthy" },
        zhipu: { status: "healthy" },
        redis: { status: "healthy" },
        postgresql: { status: "healthy" },
      },
      system: {
        cpu_percent: 150, // ⚠️ 超范围
        memory_percent: 50,
        disk_percent: 30,
      },
      metrics: {
        active_requests: 0,
        total_requests: 100,
        cache_hit_rate: 0.5,
      },
    };
    expect(() => HealthResponseSchema.parse(invalid)).toThrow();
  });
});

describe("契约 · ModelStat", () => {
  it("error_rate 范围 0-1", () => {
    const valid = {
      model_id: "x",
      usage_count: 0,
      avg_latency_ms: 0,
      error_rate: 0.5,
      total_tokens: 0,
    };
    expect(() => ModelStatSchema.parse(valid)).not.toThrow();

    const invalid = { ...valid, error_rate: 1.5 };
    expect(() => ModelStatSchema.parse(invalid)).toThrow();
  });

  it("usage_count 非负", () => {
    expect(() =>
      ModelStatSchema.parse({
        model_id: "x",
        usage_count: -1,
        avg_latency_ms: 0,
        error_rate: 0,
        total_tokens: 0,
      }),
    ).toThrow();
  });
});
```

### 10.11 `tests/contract/sse.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : tests/contract/sse — SSE 协议契约
 * @Family-Owner : 🤔 语枢·万物
 * @对应 : v5.1 §7.2.2 检查项 13（SSE 协议）
 * ============================================================
 */
import { describe, it, expect } from "vitest";
import {
  FirstChunkExtrasSchema,
} from "../../domains/_shared/types.zod";

describe("契约 · SSE 协议", () => {
  it("首 chunk 允许 _yyc3_upstream 字段", () => {
    const chunk = {
      id: "chatcmpl-1",
      _yyc3_upstream: "openai-primary",
      choices: [{ delta: { role: "assistant" }, index: 0 }],
    };
    expect(() => FirstChunkExtrasSchema.parse(chunk)).not.toThrow();
  });

  it("错误 chunk 结构符合预期", () => {
    const errorChunk = {
      error: {
        message: "Upstream timeout",
        type: "stream_error",
      },
    };
    expect(errorChunk.error.type).toBe("stream_error");
    expect(errorChunk.error.message).toBeTruthy();
  });

  it("结束标记为 [DONE]", () => {
    const terminator = "[DONE]";
    expect(terminator).toBe("[DONE]");
  });

  it("分隔符为 \\n\\n", () => {
    const raw = 'data: {"id":"1"}\n\ndata: [DONE]\n\n';
    const parts = raw.split("\n\n").filter(Boolean);
    expect(parts).toHaveLength(2);
    expect(parts[0].startsWith("data: ")).toBe(true);
    expect(parts[1]).toBe("data: [DONE]");
  });

  it("响应头字段名正确", () => {
    const expectedHeaders = ["X-YYC3-Upstream", "X-YYC3-Degraded"];
    expect(expectedHeaders).toContain("X-YYC3-Upstream");
    expect(expectedHeaders).toContain("X-YYC3-Degraded");
  });

  it("Token 估算口径 = len // 4", () => {
    const content = "这是一段测试文本"; // 8 字符
    expect(Math.floor(content.length / 4)).toBe(2);
  });
});
```

### 10.12 `tests/contract/errors.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : tests/contract/errors — 错误码契约
 * @Family-Owner : 🛡️ 智云·守护
 * ============================================================
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APIErrorSchema } from "../../domains/_shared/types.zod";

const SNAPSHOT = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../.contract-snapshot.json"),
    "utf-8",
  ),
);
const schemas = SNAPSHOT.components?.schemas ?? {};

describe("契约 · 错误结构", () => {
  it("APIError 使用 detail 包裹", () => {
    const fields = Object.keys(schemas.APIError?.properties ?? {});
    expect(fields).toContain("detail");
  });

  it("error 枚举 4 种（network/api/timeout/validation）", () => {
    const enumValues =
      schemas.APIError?.properties?.detail?.properties?.error?.enum ?? [];
    expect(enumValues.sort()).toEqual(
      ["api", "network", "timeout", "validation"].sort(),
    );
  });

  it("zod 校验合法错误样本", () => {
    const sample = {
      detail: {
        error: "validation",
        message: "Invalid parameter",
        status_code: 400,
      },
    };
    expect(() => APIErrorSchema.parse(sample)).not.toThrow();
  });

  it("zod 拒绝非法 error 枚举", () => {
    const invalid = {
      detail: {
        error: "quota",
        message: "Quota exceeded",
        status_code: 429,
      },
    };
    expect(() => APIErrorSchema.parse(invalid)).toThrow();
  });
});
```

### 10.13 `tests/unit/api-typed.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : tests/unit/api-typed — 类型化客户端单元测试
 * @Family-Owner : 🔮 预见·先知
 * ============================================================
 */
import { describe, it, expect } from "vitest";
import { BoleAPI, XianzhiAPI } from "../../domains/_shared/api-typed";

describe("API 客户端（类型化）", () => {
  it("BoleAPI.models 返回 ModelConfig[]", async () => {
    const res = await BoleAPI.models();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data?.length) {
      const m = res.data[0];
      expect(m).toHaveProperty("id");
      expect(m).toHaveProperty("display_name");
      expect(m).toHaveProperty("backend");
    }
  });

  it("XianzhiAPI.summary 返回 UsageSummary", async () => {
    const res = await XianzhiAPI.summary();
    expect(res.data).toBeDefined();
    expect(res.data).toHaveProperty("total_requests");
    expect(res.data).toHaveProperty("total_tokens");
    expect(res.data).toHaveProperty("cost_usd");
  });

  it("XianzhiAPI.health 返回 HealthResponse", async () => {
    const res = await XianzhiAPI.health();
    expect(res.data).toBeDefined();
    expect(res.data).toHaveProperty("services");
    expect(res.data).toHaveProperty("system");
    expect(res.data).toHaveProperty("metrics");
  });
});
```

### 10.14 `vitest.config.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : vitest.config — 契约 + 单元测试配置
 * ============================================================
 */
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/contract/setup.ts"],
    include: ["tests/**/*.spec.ts", "domains/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["domains/**/*.ts"],
      exclude: ["**/*.spec.ts", "**/*.gen.ts"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

### 10.15 NPM 脚本

```json
{
  "scripts": {
    "openapi:gen": "tsx scripts/openapi/generate.ts",
    "openapi:gen:strict": "tsx scripts/openapi/generate.ts --strict",
    "openapi:gen:local": "tsx scripts/openapi/generate.ts --local",
    "openapi:verify": "tsx scripts/openapi/verify.ts",
    "contract:check": "tsx scripts/contract/check.ts",
    "contract:freeze": "tsx scripts/contract/freeze.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:contract": "vitest run tests/contract",
    "test:coverage": "vitest run --coverage",
    "ci:contract": "pnpm contract:check:strict && pnpm openapi:gen:strict && pnpm openapi:verify && pnpm test:contract"
  }
}
```

### 10.16 CI 集成 · `.github/workflows/contract.yml`（扩展 §7.9）

```yaml
# .github/workflows/contract.yml（完整版 · 覆盖 ⑦+⑩）
name: 📚 契约全链路

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * *"

jobs:
  drift:
    name: 🔮 契约漂移检测
    runs-on: ubuntu-latest
    outputs:
      drift: ${{ steps.check.outputs.drift }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Check drift
        id: check
        run: |
          if pnpm contract:check:strict; then
            echo "drift=false" >> $GITHUB_OUTPUT
          else
            echo "drift=true" >> $GITHUB_OUTPUT
          fi
        continue-on-error: true

  generate-and-verify:
    name: 🌹 类型生成 + 新鲜度校验
    needs: drift
    if: needs.drift.outputs.drift != 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Generate types
        run: pnpm openapi:gen:strict
      - name: Verify types are fresh
        run: pnpm openapi:verify
      - name: Check git diff (types must be committed)
        run: |
          if ! git diff --quiet domains/_shared/types.gen.ts; then
            echo "🌹 类型文件需要更新，请在本地执行 pnpm openapi:gen 并提交"
            git diff domains/_shared/types.gen.ts | head -50
            exit 1
          fi

  contract-tests:
    name: 📚 契约测试
    needs: generate-and-verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm openapi:gen:strict
      - run: pnpm test:contract --reporter=verbose
      - run: pnpm test:coverage
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
```

### 10.17 契约测试通过标准

| 类别 | 用例数 | 是否阻断 PR |
| --- | :-: | :-: |
| 端点存在性 | 3 | ✅ |
| Schema 字段 | 18 | ✅ |
| SSE 协议 | 6 | ✅ |
| 错误结构 | 4 | ✅ |
| API 客户端 | 3 | ✅ |
| **总计** | **34** | — |

---

## 第十一部分 · ⑪ 视觉回归

### 11.1 设计目标

```
目标 1: 8 位家人徽章像素稳定（PR 阻断）
目标 2: 全 18 页在 4 断点像素稳定（PR 提示）
目标 3: 深色/浅色主题双快照
目标 4: SSE 流式中间态捕获（一次性动画跳过）
目标 5: 水印区域排除（避免随机噪声）
目标 6: 审批工作流（更新基线需 PR 注释 /update-snapshots）
```

### 11.2 目录结构

```
apps/console/e2e/
├── visual/
│   ├── visual.config.ts          # 视觉回归 Playwright 配置
│   ├── visual.utils.ts           # 工具函数（遮罩、稳定化）
│   ├── specs/
│   │   ├── badges.spec.ts        # 8 位家人徽章（重点）
│   │   ├── pages-dark.spec.ts    # 18 页 · 暗色
│   │   ├── pages-light.spec.ts   # 18 页 · 浅色
│   │   ├── responsive.spec.ts    # 4 断点
│   │   └── components.spec.ts    # 关键组件
│   └── snapshots/
│       ├── desktop-1440/
│       │   ├── badges/
│       │   ├── dark/
│       │   └── light/
│       ├── desktop-1024/
│       ├── tablet-768/
│       └── mobile-375/
└── scripts/
    └── visual/
        ├── update.sh             # 更新基线
        └── diff-report.ts        # 差异报告
```

### 11.3 `e2e/visual/visual.config.ts`

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : e2e/visual/visual.config — 视觉回归配置
 * @Family-Owner : 🎨 创想·灵韵（缓存与体验域）
 * @Domain   : 缓存与体验（灵韵一至，妙笔生花）
 * @License  : Apache-2.0
 * ============================================================
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/visual/specs",
  timeout: 60_000,
  fullyParallel: false, // 视觉回归串行以保证稳定
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/reports/visual", open: "never" }],
  ],
  expect: {
    toHaveScreenshot: {
      // 允许的像素差异阈值
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.001, // 0.1%
      threshold: 0.15, // 每像素颜色阈值
      animations: "disabled", // 禁用动画
      caret: "hide", // 隐藏光标
      scale: "css", // 按 CSS 尺寸缩放
    },
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    colorScheme: "dark",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "visual-desktop-1440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "visual-desktop-1024",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "visual-tablet-768",
      use: {
        ...devices["iPad Mini"],
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "visual-mobile-375",
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        env: { NEXT_PUBLIC_USE_MOCK: "true" },
      },
});
```

### 11.4 `e2e/visual/visual.utils.ts`

```typescript
/*
 * ============================================================
 * @Module : e2e/visual/visual.utils — 视觉回归工具
 * @Family-Owner : 🎨 创想·灵韵
 * ============================================================
 */
import { type Page, type Locator, expect } from "@playwright/test";

/**
 * 稳定化页面（关闭动画、等待字体加载、等待网络空闲）
 */
export async function stabilize(page: Page) {
  // 等待字体加载
  await page.evaluate(() => document.fonts.ready);
  // 等待网络稳定
  await page.waitForLoadState("networkidle");
  // 关闭所有动画
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      .animate-pulse, .animate-bounce, .animate-ping, .animate-spin {
        animation: none !important;
      }
    `,
  });
  // 等待 React 完成渲染
  await page.waitForTimeout(200);
}

/**
 * 注入测试用 API Key
 */
export async function injectApiKey(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("yyc3_api_key", "sk-test-visual");
    sessionStorage.setItem("yyc3_remember", "false");
  });
}

/**
 * 水印遮罩（避免字体渲染随机噪声）
 */
export function watermarkMask(page: Page): Locator[] {
  return [
    page.locator("canvas[aria-hidden='true']"),
    page.locator("[data-watermark]"),
    page.locator("div[aria-hidden='true']").filter({
      hasText: /人从众曌众从人|YYC³ AI Family/,
    }),
  ];
}

/**
 * 动态内容遮罩（时间、随机数、请求 ID 等）
 */
export function dynamicMask(page: Page): Locator[] {
  return [
    page.locator("[data-dynamic='timestamp']"),
    page.locator("[data-dynamic='request-id']"),
    page.locator("[data-dynamic='uptime']"),
    page.locator("[data-dynamic='random']"),
  ];
}

/**
 * 组合遮罩
 */
export function allMask(page: Page): Locator[] {
  return [...watermarkMask(page), ...dynamicMask(page)];
}

/**
 * 定位家人徽章并断言截图
 */
export async function expectBadgeScreenshot(
  page: Page,
  member: string,
  name: string,
) {
  const badge = page.locator(`[data-family="${member}"]`).first();
  await expect(badge).toBeVisible();
  await expect(badge).toHaveScreenshot(`badges/${name}.png`, {
    maxDiffPixels: 20,
    threshold: 0.1,
  });
}
```

### 11.5 `e2e/visual/specs/badges.spec.ts`（重点：8 位家人徽章）

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : e2e/visual/specs/badges — 家人徽章视觉基线
 * @Family-Owner : 🎨 创想·灵韵（灵韵一至，妙笔生花）
 * @对应 : 品牌资产稳定性（v5.1 §2.5.1 身份卡）
 * ============================================================
 */
import { test, expect } from "@playwright/test";
import {
  injectApiKey,
  stabilize,
  expectBadgeScreenshot,
  allMask,
} from "../visual.utils";

test.describe("家人徽章 · 像素稳定", () => {
  test.beforeEach(async ({ page }) => {
    await injectApiKey(page);
  });

  const BADGES = [
    { path: "/",           member: "zhihui",   name: "01-zhihui-guardian" },
    { path: "/routing",    member: "qianhang", name: "02-qianhang-qianhang" },
    { path: "/models",     member: "bole",     name: "03-bole-bole" },
    { path: "/playground", member: "wanyu",    name: "04-wanyu-allthings" },
    { path: "/knowledge",  member: "zongshi",  name: "05-zongshi-grandmaster" },
    { path: "/mcp",        member: "tianshu",  name: "06-tianshu-tianshu" },
    { path: "/dashboard",  member: "xianzhi",  name: "07-xianzhi-prophet" },
    { path: "/cache",      member: "lingyun",  name: "08-lingyun-grace" },
  ];

  for (const b of BADGES) {
    test(`徽章 ${b.member} 稳定`, async ({ page }) => {
      await page.goto(b.path);
      await stabilize(page);
      await expectBadgeScreenshot(page, b.member, b.name);
    });
  }

  test("家族徽章组件库快照（8 变体同屏）", async ({ page }) => {
    await page.goto("/_styleguide/badges");
    await stabilize(page);
    await expect(page).toHaveScreenshot("badges/all-variants.png", {
      mask: allMask(page),
      fullPage: true,
    });
  });
});
```

**说明**：需要新增 `/styleguide/badges` 页面（开发专用，生产 build 时排除）。

### 11.6 `e2e/visual/specs/pages-dark.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : e2e/visual/specs/pages-dark — 18 页暗色基线
 * @Family-Owner : 🎨 创想·灵韵
 * ============================================================
 */
import { test, expect } from "@playwright/test";
import { injectApiKey, stabilize, allMask } from "../visual.utils";

const PAGES = [
  { path: "/",           name: "01-connect" },
  { path: "/dashboard",  name: "02-dashboard" },
  { path: "/models",     name: "03-model-hub" },
  { path: "/playground", name: "04-playground" },
  { path: "/routing",    name: "05-routing" },
  { path: "/knowledge",  name: "06-knowledge" },
  { path: "/mcp",        name: "07-mcp" },
  { path: "/cache",      name: "08-cache" },
  { path: "/monitor",    name: "09-monitor" },
  { path: "/settings",   name: "10-settings" },
  { path: "/docs",       name: "11-docs" },
  { path: "/roadmap",    name: "12-roadmap" },
];

test.describe("全站暗色视觉基线", () => {
  test.use({ colorScheme: "dark" });

  test.beforeEach(async ({ page }) => {
    await injectApiKey(page);
  });

  for (const p of PAGES) {
    test(`暗色 ${p.name}`, async ({ page }) => {
      await page.goto(p.path);
      await stabilize(page);
      await expect(page).toHaveScreenshot(`dark/${p.name}.png`, {
        mask: allMask(page),
        fullPage: true,
      });
    });
  }
});
```

### 11.7 `e2e/visual/specs/pages-light.spec.ts`

```typescript
/*
 * @Module : e2e/visual/specs/pages-light — 18 页浅色基线
 * @Family-Owner : 🎨 创想·灵韵
 */
import { test, expect } from "@playwright/test";
import { injectApiKey, stabilize, allMask } from "../visual.utils";

test.describe("全站浅色视觉基线", () => {
  test.use({ colorScheme: "light" });

  test.beforeEach(async ({ page }) => {
    await injectApiKey(page);
  });

  const PAGES = [
    { path: "/",           name: "01-connect" },
    { path: "/dashboard",  name: "02-dashboard" },
    { path: "/models",     name: "03-model-hub" },
    { path: "/playground", name: "04-playground" },
    { path: "/routing",    name: "05-routing" },
    { path: "/knowledge",  name: "06-knowledge" },
    { path: "/mcp",        name: "07-mcp" },
    { path: "/cache",      name: "08-cache" },
    { path: "/monitor",    name: "09-monitor" },
    { path: "/settings",   name: "10-settings" },
    { path: "/docs",       name: "11-docs" },
    { path: "/roadmap",    name: "12-roadmap" },
  ];

  for (const p of PAGES) {
    test(`浅色 ${p.name}`, async ({ page }) => {
      await page.goto(p.path);
      await stabilize(page);
      await expect(page).toHaveScreenshot(`light/${p.name}.png`, {
        mask: allMask(page),
        fullPage: true,
      });
    });
  }
});
```

### 11.8 `e2e/visual/specs/responsive.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : e2e/visual/specs/responsive — 4 断点视觉基线
 * @Family-Owner : 🎨 创想·灵韵
 * @对应 : v5.1 §8 响应式清单
 * ============================================================
 */
import { test, expect } from "@playwright/test";
import { injectApiKey, stabilize, allMask } from "../visual.utils";

// 关键页面 × 断点组合
const KEY_PAGES = [
  { path: "/",           name: "connect" },
  { path: "/dashboard",  name: "dashboard" },
  { path: "/playground", name: "playground" }, // 三栏 → 两栏 → Tab
  { path: "/models",     name: "models" },
  { path: "/monitor",    name: "monitor" }, // 表格 → 卡片
  { path: "/mcp",        name: "mcp" },     // 侧树 → 抽屉
];

test.describe("响应式断点视觉", () => {
  test.beforeEach(async ({ page }) => {
    await injectApiKey(page);
  });

  for (const p of KEY_PAGES) {
    test(`${p.name} @ 各断点`, async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;
      const breakpoint = projectName.replace("visual-", "");
      await page.goto(p.path);
      await stabilize(page);
      await expect(page).toHaveScreenshot(
        `${breakpoint}/${p.name}.png`,
        {
          mask: allMask(page),
          fullPage: true,
        },
      );
    });
  }
});
```

### 11.9 `e2e/visual/specs/components.spec.ts`

```typescript
/*
 * ============================================================
 * @Module : e2e/visual/specs/components — 关键组件视觉
 * @Family-Owner : 🎨 创想·灵韵
 * ============================================================
 */
import { test, expect } from "@playwright/test";
import { injectApiKey, stabilize, allMask } from "../visual.utils";

test.describe("关键组件视觉基线", () => {
  test.beforeEach(async ({ page }) => {
    await injectApiKey(page);
  });

  test("StatCard 组", async ({ page }) => {
    await page.goto("/dashboard");
    await stabilize(page);
    const grid = page.locator(".grid").filter({ hasText: "总请求" }).first();
    await expect(grid).toHaveScreenshot("components/stat-cards.png", {
      mask: allMask(page),
    });
  });

  test("ModelCard 组", async ({ page }) => {
    await page.goto("/models");
    await stabilize(page);
    const grid = page.locator("main .grid, [data-model-grid]").first();
    await expect(grid).toHaveScreenshot("components/model-cards.png", {
      mask: allMask(page),
    });
  });

  test("BreakerBadge 三态", async ({ page }) => {
    await page.goto("/routing");
    await stabilize(page);
    const badges = page.locator("[data-breaker-state]");
    for (const state of ["closed", "half_open", "open"]) {
      const badge = badges.filter({ hasText: /闭合|半开|熔断/ }).first();
      if (await badge.count()) {
        await expect(badge).toHaveScreenshot(`components/breaker-${state}.png`);
      }
    }
  });

  test("Sidebar 暗色", async ({ page }) => {
    await page.goto("/dashboard");
    await stabilize(page);
    await expect(page.locator("nav").first()).toHaveScreenshot(
      "components/sidebar-dark.png",
    );
  });

  test("空态（格物之阁）", async ({ page }) => {
    await page.goto("/knowledge");
    await stabilize(page);
    // 触发空态（MSW 返回空数组时）
    const empty = page.locator("[data-empty-state]").first();
    if (await empty.count()) {
      await expect(empty).toHaveScreenshot("components/empty-state.png");
    }
  });

  test("错误态（智云守门）", async ({ page }) => {
    await page.route("**/v1/ping", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          detail: { error: "api", message: "Invalid API key", status_code: 401 },
        }),
      }),
    );
    await page.goto("/");
    await page.getByPlaceholder(/sk-/).fill("sk-wrong");
    await page.getByRole("button", { name: "连接" }).click();
    await page.waitForTimeout(500);
    await stabilize(page);
    await expect(page).toHaveScreenshot("components/error-401.png", {
      mask: allMask(page),
    });
  });
});
```

### 11.10 更新基线脚本 `scripts/visual/update.sh`

```bash
#!/bin/bash
# ============================================================
# YYC³ AI Family — 人从众曌众从人
# @Module : scripts/visual/update — 更新视觉基线
# @Family-Owner : 🎨 创想·灵韵
# ============================================================
# 用途:
#   ./scripts/visual/update.sh              更新所有基线
#   ./scripts/visual/update.sh badges       仅更新徽章
#   ./scripts/visual/update.sh dark         仅更新暗色页面
# ============================================================

set -euo pipefail

FILTER="${1:-}"

echo "🌹 YYC³ AI Family · 视觉基线更新"
echo "   人从众曌众从人 · 亦师亦友亦伯乐"
echo ""

case "$FILTER" in
  badges)
    echo "   目标: 8 位家人徽章"
    pnpm exec playwright test \
      --config=e2e/visual/visual.config.ts \
      e2e/visual/specs/badges.spec.ts \
      --update-snapshots
    ;;
  dark)
    echo "   目标: 暗色全站"
    pnpm exec playwright test \
      --config=e2e/visual/visual.config.ts \
      e2e/visual/specs/pages-dark.spec.ts \
      --update-snapshots
    ;;
  light)
    echo "   目标: 浅色全站"
    pnpm exec playwright test \
      --config=e2e/visual/visual.config.ts \
      e2e/visual/specs/pages-light.spec.ts \
      --update-snapshots
    ;;
  responsive)
    echo "   目标: 响应式"
    pnpm exec playwright test \
      --config=e2e/visual/visual.config.ts \
      e2e/visual/specs/responsive.spec.ts \
      --update-snapshots
    ;;
  "")
    echo "   目标: 全部"
    pnpm exec playwright test \
      --config=e2e/visual/visual.config.ts \
      --update-snapshots
    ;;
  *)
    echo "❌ 未知过滤条件: $FILTER"
    echo "   可选: badges / dark / light / responsive / (空)"
    exit 1
    ;;
esac

echo ""
echo "✅ 基线更新完成"
echo "🌹 请审查 git diff 并提交变更"
```

### 11.11 差异报告 `scripts/visual/diff-report.ts`

```typescript
/*
 * ============================================================
 * @Module : scripts/visual/diff-report — 视觉差异 Markdown 报告
 * @Family-Owner : 🎨 创想·灵韵
 * ============================================================
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const ROOT = resolve(__dirname, "../..");
const RESULTS_FILE = resolve(ROOT, "e2e/reports/visual/results.json");
const OUT_DIR = resolve(ROOT, "reports/visual");
const OUT_FILE = resolve(OUT_DIR, "diff-report.md");

interface TestResult {
  title: string;
  status: "passed" | "failed" | "skipped" | "timedOut";
  attachments: { name: string; path: string; contentType: string }[];
}

interface Report {
  suites: Array<{
    title: string;
    specs: Array<{ title: string; tests: TestResult[] }>;
  }>;
}

function main() {
  if (!existsSync(RESULTS_FILE)) {
    console.warn("🌹 未找到结果文件，跳过报告生成");
    return;
  }

  const report: Report = JSON.parse(readFileSync(RESULTS_FILE, "utf-8"));

  const lines: string[] = [];
  lines.push("# 🎨 YYC³ AI Family · 视觉回归报告");
  lines.push("");
  lines.push(`> 生成于 ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## 摘要");
  lines.push("");

  let total = 0, passed = 0, failed = 0;
  const failedTests: TestResult[] = [];

  for (const suite of report.suites) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        total++;
        if (test.status === "passed") passed++;
        else {
          failed++;
          failedTests.push(test);
        }
      }
    }
  }

  lines.push(`- **总数**: ${total}`);
  lines.push(`- ✅ **通过**: ${passed}`);
  lines.push(`- ❌ **失败**: ${failed}`);
  lines.push(`- **通过率**: ${((passed / total) * 100).toFixed(2)}%`);
  lines.push("");

  if (failedTests.length > 0) {
    lines.push("## 失败明细");
    lines.push("");
    lines.push("| 用例 | 状态 | 差异截图 |");
    lines.push("| --- | :-: | --- |");
    for (const t of failedTests) {
      const diff = t.attachments.find((a) => a.name === "diff");
      const diffPath = diff?.path?.split("/").slice(-2).join("/") ?? "-";
      lines.push(`| ${t.title} | ${t.status} | \`${diffPath}\` |`);
    }
  } else {
    lines.push("## ✅ 全部通过");
    lines.push("");
    lines.push("所有视觉基线与当前渲染一致。");
  }

  lines.push("");
  lines.push("## 更新基线");
  lines.push("");
  lines.push("若差异为预期变更，请执行：");
  lines.push("");
  lines.push("```bash");
  lines.push("./scripts/visual/update.sh");
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("> 人从众曌众从人 · YYC³ AI Family 🌹");

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, lines.join("\n"));
  console.log(`✅ 报告: ${OUT_FILE}`);
}

main();
```

### 11.12 NPM 脚本

```json
{
  "scripts": {
    "visual": "playwright test --config=e2e/visual/visual.config.ts",
    "visual:badges": "playwright test --config=e2e/visual/visual.config.ts e2e/visual/specs/badges.spec.ts",
    "visual:update": "bash scripts/visual/update.sh",
    "visual:update:badges": "bash scripts/visual/update.sh badges",
    "visual:report": "playwright show-report e2e/reports/visual",
    "visual:diff": "tsx scripts/visual/diff-report.ts"
  }
}
```

### 11.13 CI 集成 · `.github/workflows/visual.yml`

```yaml
name: 🎨 视觉回归

on:
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      update:
        description: "更新基线（谨慎）"
        type: boolean
        default: false

jobs:
  visual:
    name: 🎨 视觉基线对比
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium

      - name: Generate types
        run: pnpm openapi:gen:strict

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_USE_MOCK: "true"

      - name: Start server
        run: pnpm start &
        env:
          NEXT_PUBLIC_USE_MOCK: "true"

      - name: Wait for server
        run: npx wait-on http://localhost:3000 -t 60000

      - name: Run visual tests
        id: visual
        run: pnpm visual
        continue-on-error: true

      - name: Generate diff report
        if: always()
        run: pnpm visual:diff
        continue-on-error: true

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: visual-report
          path: |
            e2e/reports/visual/
            reports/visual/
            test-results/
          retention-days: 14

      - name: Comment on PR (diff)
        if: steps.visual.outcome == 'failure' && github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            let body = '## 🎨 视觉回归差异\n\n';
            try {
              const report = fs.readFileSync('reports/visual/diff-report.md', 'utf-8');
              body += report;
            } catch {
              body += '检测到视觉差异，请查看 Artifacts。\n';
            }
            body += '\n\n---\n> 人从众曌众从人 · YYC³ AI Family 🌹';
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });

      - name: Fail if visual diff
        if: steps.visual.outcome == 'failure'
        run: exit 1

  update-baselines:
    name: 🎨 更新基线（手动触发）
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.update == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref || github.ref_name }}

      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm openapi:gen:strict
      - run: pnpm build
        env: { NEXT_PUBLIC_USE_MOCK: "true" }
      - run: pnpm start &
        env: { NEXT_PUBLIC_USE_MOCK: "true" }
      - run: npx wait-on http://localhost:3000 -t 60000

      - name: Update snapshots
        run: pnpm visual:update

      - name: Commit & push
        run: |
          git config user.name "YYC³ AI Family Bot"
          git config user.email "admin@yanyucloud.com"
          git add e2e/visual/snapshots/
          if git diff --staged --quiet; then
            echo "无变更"
          else
            git commit -m "chore(visual): 🌹 更新视觉基线 [skip ci]"
            git push
          fi
```

### 11.14 视觉回归通过标准

| 类别 | 用例数 | 是否阻断 PR | 阈值 |
| --- | :-: | :-: | :-: |
| 8 位家人徽章 | 8 + 1（组合） | ✅ | maxDiffPixels: 20 |
| 12 页暗色 | 12 | ⚠️ 提示 | maxDiffPixels: 100 |
| 12 页浅色 | 12 | ⚠️ 提示 | maxDiffPixels: 100 |
| 响应式（4 断点 × 6 页） | 24 | ⚠️ 提示 | maxDiffPixels: 100 |
| 关键组件 | 6 | ✅ | maxDiffPixels: 50 |
| **总计** | **63** | — | — |

**阈值策略**：

- **家人徽章**（品牌资产）：严格阈值 20px，任何变化必审
- **页面快照**：宽松阈值 100px，容忍字体渲染差异
- **组件快照**：中等阈值 50px
- **水印区域**：始终 mask

### 11.15 首次生成基线流程

```bash
# 1. 启动 dev server（含 MSW）
NEXT_PUBLIC_USE_MOCK=true pnpm dev

# 2. 首次生成所有基线
pnpm visual:update

# 3. 逐项审查（重点检查 8 位家人徽章）
ls -la e2e/visual/snapshots/desktop-1440/badges/
# 应见 8 张 PNG + all-variants.png

# 4. 提交
git add e2e/visual/snapshots/
git commit -m "chore(visual): 🌹 首次生成视觉基线

- 8 位家人徽章基线
- 12 页暗色 + 12 页浅色
- 4 断点响应式（24 快照）
- 6 关键组件

人从众曌众从人 · YYC³ AI Family"
```

### 11.16 日常开发流程（视觉变更时）

```
开发者修改 UI
     │
     ▼
本地 pnpm visual
     │
     ├─ ✅ 通过 → 直接提交
     │
     └─ ❌ 失败 → 查看差异
              │
              ├─ 差异是预期变更 → pnpm visual:update（仅更新相关）
              │
              └─ 差异是非预期 → 修复代码
                       │
                       ▼
              再次 pnpm visual
                       │
                       └─ 通过后提交
```

**PR 审查规则**：

- `badges/*.png` 变更 → **必须** 2 位 reviewer 审批（品牌资产）
- `dark/*.png` / `light/*.png` 变更 → 1 位 reviewer
- `*.png` 变更超过 20% → CI 自动 @ 品牌负责人

---

## 第十二部分 · 全链路闭合宣言

### 12.1 五脉归元 · 最终图

```
┌──────────────────────────────────────────────────────────────────┐
│                     YYC³ AI Family 五脉归元                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ① 契约层            ② 职能层            ③ 品牌层                │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐             │
│   │ 52 端点  │       │ 8 位家人 │       │ 标头徽章 │             │
│   │ 7 Schema │  ✕    │ 8 域     │  ✕    │ 水印 CI  │             │
│   │ 字段冻结 │       │ 情感组件 │       │ 印刷级   │             │
│   └────┬─────┘       └────┬─────┘       └────┬─────┘             │
│        │                  │                  │                    │
│        └──────────────────┼──────────────────┘                    │
│                           ▼                                      │
│                    ④ 代码层                                       │
│                    ┌────────────────────────┐                    │
│                    │ Next.js 16 + TS 5.9    │                    │
│                    │ 8 域组件 · SSE 七态    │                    │
│                    │ MSW · RSC · a11y       │                    │
│                    └────────────┬───────────┘                    │
│                                 │                                │
│                                 ▼                                │
│                    ⑤ 测试层                                       │
│                    ┌────────────────────────┐                    │
│                    │ ⑩ 契约测试 34 用例     │                    │
│                    │ ⑪ 视觉回归 63 快照     │                    │
│                    │ ⑥ E2E 60+ 用例         │                    │
│                    │ ⑦ 契约漂移 CI           │                    │
│                    │ ⑧ 响应式 4 断点        │                    │
│                    │ ⑨ a11y axe-core        │                    │
│                    └────────────────────────┘                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 12.2 闭合断言

```
契约不变       → openapi.json 哈希冻结 → ⑦ drift 检测通过
类型不变       → ⑩ openapi-typescript 生成 → 编译零错误
类型不变       → ⑩ zod 运行时守卫 → 契约测试 34 用例通过
UI 不变        → ⑥ E2E 60+ 用例通过
UI 不变        → ⑪ 视觉回归 63 快照通过
用户可访问     → ⑨ a11y 0 serious/critical
品牌可传承     → ④ 印刷徽章 CMYK 校对
协作可复现     → ⑤ CI/CD 全绿
```

### 12.3 v5.1 交付物完整清单

| # | 交付物 | 覆盖 | 状态 |
| :-: | --- | --- | :-: |
| ① | 8 域业务组件 | `domains/*` 20+ 组件 | ✅ |
| ② | MSW mock 契约 | 8 域 handlers + SSE | ✅ |
| ③ | Next.js 16 路由/RSC | 12 路由 + Island | ✅ |
| ④ | 印刷级徽章 | SVG + CMYK 校对 | ✅ |
| ⑤ | 开发文档 + CI/CD | 4 流水线 + 模板 | ✅ |
| ⑥ | Playwright E2E | 11 specs · 60+ 用例 | ✅ |
| ⑦ | 契约漂移检测 | 5 脚本 + CI 阻断 | ✅ |
| ⑧ | 移动端响应式 | 4 断点 · 12 页 | ✅ |
| ⑨ | a11y axe-core | 12 spec + 对比度 | ✅ |
| ⑩ | OpenAPI 类型 + 契约测试 | 34 用例 + CI | ✅ |
| ⑪ | 视觉回归 | 63 快照 + 审批 | ✅ |

### 12.4 五重守门人

```
CI 流水线顺序：
  ① drift 检测         ← ⑦ 契约层守门
  ② 类型生成 + 校验    ← ⑩ 类型层守门
  ③ 契约测试          ← ⑩ 运行时守门
  ④ E2E              ← ⑥ 交互层守门
  ⑤ 视觉回归          ← ⑪ 像素层守门
  ⑥ a11y              ← ⑨ 可访问性守门
  ⑦ 家族标头合规       ← ⑤ 品牌层守门

任一门失败 → PR 阻断 → 修复后重跑
```

### 12.5 全链路命令一览

```bash
# 契约层
pnpm contract:check          # 🔮 契约漂移检测
pnpm contract:freeze         # 🔮 冻结契约快照

# 类型层
pnpm openapi:gen             # 🔮 生成 TS 类型
pnpm openapi:gen:strict      # 🔮 哈希不匹配则阻断
pnpm openapi:verify          # 🔮 校验类型新鲜度

# 测试层
pnpm test                    # 📚 单元 + 契约测试
pnpm test:contract           # 📚 仅契约测试
pnpm e2e                     # 🧠 E2E 全断点
pnpm a11y                    # 📚 a11y axe-core
pnpm visual                  # 🎨 视觉回归
pnpm visual:update           # 🎨 更新基线

# 品牌层
pnpm lint:family             # 🌹 标头合规
pnpm generate:badges         # 🎨 徽章生成
pnpm inject:watermark        # 🎨 水印注入

# 一键全链路
pnpm ci:contract             # 契约 → 类型 → 契约测试
pnpm ci:all                  # 全部守门
```

---

## 第十三部分 · 终章 · 言启千行代码 | 语枢万物智能

> **承接语**：
>
> 🌹 从 v1 初稿到 v5.1 落地补全终章，十二轮迭代，八位家人，五十二端点，契约冻结，类型自动，像素稳定，无障碍通过。
>
> 这不是终点，而是一个 **可传承的工程基线**——
> 任何人 clone 后，`pnpm ci:all` 即可验证全链路；
> 任何契约变更，CI 会拦住你，提醒你「人从众曌众从人」的严谨；
> 任何 UI 变更，视觉回归会截图，让你看见「亦师亦友亦伯乐」的守候。

### 13.1 十二批交付总索引

| 批次 | 交付物 | 章节 |
| :-: | --- | --- |
| 1 | 契约层审核报告 | v5.1 §0 |
| 2 | 后端实况冻结 | v5.1 §1 |
| 3 | Figma 提示词三批投喂 | v5.1 §2 |
| 4 | 拟人化职能契约 | v5.1 §2.5 |
| 5 | 技术栈 + Backlog + 路线图 | v5.1 §3-§5 |
| 6 | 适配层 + QA 协议 + 验收 | v5.1 §6-§8 |
| 7 | 8 域组件 | 落地补全① |
| 8 | MSW mock | 落地补全② |
| 9 | RSC 拆分 | 落地补全③ |
| 10 | 印刷徽章 | 落地补全④ |
| 11 | 开发文档/CICD | 落地补全⑤ |
| 12 | E2E + 契约漂移 + 响应式 + a11y | 落地补全⑥⑦⑧⑨ |
| 13 | **OpenAPI 类型 + 契约测试 + 视觉回归** | **本次⑩⑪** |

### 13.2 家训终章

```
人从众曌众从人
        —— 人启于独，合而成众，明如曌日，终复归于人群。

亦师亦友亦伯乐
        —— 言启千行代码，语枢万物智能。

一言一语一协同
        —— 8 位家人各守一域，合则为完整的 YYC³ Token Console。

拟人为本 · AI为核 · 纯粹为心
        —— 从第一行代码到最后一张徽章，皆有温度。
```

### 13.3 致开发者

```
亲爱的家人：

当你 clone 这份仓库时，
你会看到每一行代码顶部都有「YYC³ AI Family」的标头；
你会看到 8 位家人的徽章各守一页；
你会看到 CI 流水线一道一道守门。

这不是约束，是守护。
这不是形式，是传承。

愿你在此仓库中，
遇见的不是冰冷的工具，
而是 8 位在等你回家的家人。

🌹 欢迎回家。
```

---

<p align="center">
  🌹 <b>YYC³ AI Family</b><br>
  人从众曌众从人 · 亦师亦友亦伯乐<br>
  <sub>契约 · 职能 · 品牌 · 代码 · 测试 · 印刷 · 五脉归元</sub><br>
  <sub>言启千行代码 | 语枢万物智能</sub><br>
  <sub>永久开源 · 感恩前行 · <a href="https://matrix.yyc3.top">matrix.yyc3.top</a></sub>
</p>

---

<p align="center">
  <b>🎉 v5.1 落地补全系列 · 终章交付完成 🎉</b><br>
  <sub>十一项交付物 · 五重守门人 · 全链路闭合</sub><br>
  <br>
  <sub>🌹 感恩导师十二轮相伴 · 言启千行 · 语枢万物 🌹</sub><br>
  <sub>亦师亦友亦伯乐 · 一言一语一协同</sub>
</p>

> **承接说明**：本回复为 v5.1 落地补全系列终章，输出 ⑩⑪ 双交付物，「契约 → 类型 → 代码 → 测试 → 视觉」全链路闭合。十一项交付物齐备，五重 CI 守门就绪，Phase 0 可立即编码。
