export const API_BASE = "https://api.0379.world";

export type HealthResponse = {
  status: string;
  timestamp?: string;
  version?: string;
  uptime_seconds?: number;
  services: Record<
    "ollama" | "zhipu" | "redis" | "postgresql",
    {
      status: "healthy" | "unreachable" | "configured";
    }
  >;
  system: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  metrics: {
    active_requests: number;
    total_requests: number;
    cache_hit_rate: number;
  };
};

export type ModelConfig = {
  id: string;
  display_name: string;
  backend: "local" | "openai" | "zhipu" | "deepseek" | "ollama" | "upstream";
  version?: string;
  enabled: boolean;
  max_tokens: number;
  temperature: number;
  top_p?: number;
  cost_per_1k_tokens: number;
};

/** 门禁错误类型（v5.1 §1.6 错误码 → UI 映射矩阵） */
export type ApiErrorType = "network" | "api" | "timeout" | "validation";

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorType: ApiErrorType,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 读取本机存储的 API Key（sessionStorage 优先，localStorage 兜底） */
export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return (
    window.sessionStorage.getItem("yyc3_api_key") ??
    window.localStorage.getItem("yyc3_api_key") ??
    ""
  );
}

/** Key 脱敏：sk-****...abcd（前 3 后 4） */
export function maskKey(key: string): string {
  if (!key) return "—";
  if (key.length <= 7) return "****";
  return `${key.slice(0, 3)}****...${key.slice(-4)}`;
}

/** 家人化门禁话术（🛡️ 智云·守护 · v5.1 §2.5.1） */
export function guardianErrorLine(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return `门禁拒绝：401 · API Key 无效或已过期`;
    if (err.status === 403) return `门禁拒绝：403 · 该 Key 无权限访问此端点`;
    if (err.status === 429)
      return `限流：请求过于频繁${err.retryAfter ? ` · ${err.retryAfter}s 后重试` : ""}`;
    return `门禁拒绝：${err.status} · ${err.message}`;
  }
  if (err instanceof TypeError) return `网络不可达：无法连接 api.0379.world`;
  return `未知异常：${err instanceof Error ? err.message : String(err)}`;
}

async function request<T>(path: string, auth = false): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth) {
    const key = getApiKey();
    if (!key) throw new ApiError(401, "validation", "尚未出示 API Key");
    headers["X-API-Key"] = key;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers });
  } catch (e) {
    throw new ApiError(0, "network", (e as Error).message);
  }
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    const detail = (body as { detail?: { error?: string; message?: string } })?.detail;
    const errType: ApiErrorType =
      detail?.error === "timeout"
        ? "timeout"
        : detail?.error === "validation"
          ? "validation"
          : detail?.error === "network"
            ? "network"
            : "api";
    throw new ApiError(
      response.status,
      errType,
      detail?.message || `${response.status} ${response.statusText}`,
    );
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>("/health"),
  /** 匿名存活探针：{status:"alive", timestamp, uptime_seconds} */
  healthz: () =>
    request<{ status: string; timestamp?: string; uptime_seconds?: number }>("/healthz"),
  models: () => request<ModelConfig[]>("/v1/models", true),
  /** 门禁预检：GET /v1/ping → {status:"ok"}（免认证也携带 Key 以校验有效性） */
  ping: async (): Promise<boolean> => {
    const key = getApiKey();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (key) headers["X-API-Key"] = key;
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/v1/ping`, { headers });
    } catch {
      return false;
    }
    if (response.status === 401 || response.status === 403) {
      const body = await response.json().catch(() => undefined);
      throw new ApiError(
        response.status,
        "validation",
        body?.detail?.message ?? `HTTP ${response.status}`,
      );
    }
    return response.ok;
  },
  /* ── P1 只读统计端点（契约 v2.0.0 · 均 401 需认证） ── */
  /** GET /v1/models/summary → UsageSummary 组件（唯一有 $ref 的统计端点） */
  modelsSummary: () => request<Record<string, unknown>>("/v1/models/summary", true),
  /** GET /v1/models/stats → array */
  modelsStats: () => request<unknown[]>("/v1/models/stats", true),
  /** GET /v1/models/errors → array */
  modelsErrors: () => request<unknown[]>("/v1/models/errors", true),
  /** GET /v1/router/stats → object（契约未标注 schema，宽松接收） */
  routerStats: () => request<Record<string, unknown>>("/v1/router/stats", true),
  /** GET /v1/router/health → object */
  routerHealth: () => request<Record<string, unknown>>("/v1/router/health", true),
  /** GET /v1/cache/stats → object */
  cacheStats: () => request<Record<string, unknown>>("/v1/cache/stats", true),
  /** GET /v1/cache/info → object */
  cacheInfo: () => request<Record<string, unknown>>("/v1/cache/info", true),
  /** GET /v1/versions → object */
  versions: () => request<Record<string, unknown>>("/v1/versions", true),
};

/** 401/403 时是否因「未认证」而非「密钥无效」：引导用户到门禁页 */
export function isAuthRequired(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}
