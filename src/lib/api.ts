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

async function request<T>(path: string, auth = false, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init?.body) headers["Content-Type"] = "application/json";
  if (auth) {
    const key = getApiKey();
    if (!key) throw new ApiError(401, "validation", "尚未出示 API Key");
    headers["X-API-Key"] = key;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
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
  /* ── P1 knowledge / mcp 域（契约 v2.0.0） ── */
  /** GET /v1/knowledge-bases → KnowledgeBaseResponse[] */
  knowledgeBases: () => request<KnowledgeBaseResponse[]>("/v1/knowledge-bases", true),
  /** GET /v1/documents?knowledge_base_id= → DocumentResponse[] */
  documents: (kbId?: string) =>
    request<DocumentResponse[]>(
      `/v1/documents${kbId ? `?knowledge_base_id=${encodeURIComponent(kbId)}` : ""}`,
      true,
    ),
  /** GET /v1/mcp/tools → MCPToolsList（智谱 + 本地工具注册表） */
  mcpTools: () => request<MCPToolsList>("/v1/mcp/tools", true),
  /** GET /v1/mcp/local/tools → object（契约未标注 schema，宽松接收） */
  mcpLocalTools: () => request<Record<string, unknown>>("/v1/mcp/local/tools", true),
  /** GET /v1/mcp/local/status → object */
  mcpLocalStatus: () => request<Record<string, unknown>>("/v1/mcp/local/status", true),
  /** POST /v1/rag/search → SearchResponse（向量/混合检索，契约 SearchRequest） */
  ragSearch: (req: RAGSearchRequest) =>
    request<RAGSearchResponse>("/v1/rag/search", true, {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

/** 知识库条目（契约 KnowledgeBaseResponse） */
export type KnowledgeBaseResponse = {
  id: string;
  name: string;
  description?: string | null;
  embedding_model: string;
  icon: string;
  background: string;
  status: string;
  document_count: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
};

/** 文档条目（契约 DocumentResponse） */
export type DocumentResponse = {
  id: string;
  knowledge_base_id: string;
  title: string;
  source_type: string;
  source_url?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  status?: string;
  created_at?: string;
};

/** MCP 工具注册表（契约 MCPToolsList） */
export type MCPToolsList = {
  zhipu_tools?: Record<string, unknown>[];
  local_tools?: Record<string, unknown>[];
  total_count: number;
};

/** RAG 检索请求（契约 SearchRequest：query 必填 + kb_ids 必填，top_k≤20 · threshold 0-1） */
export type RAGSearchRequest = {
  query: string;
  knowledge_base_ids: string[];
  top_k?: number;
  threshold?: number;
  search_type?: "semantic" | "hybrid";
};

/** RAG 检索结果条目（契约 SearchResult） */
export type RAGSearchResult = {
  chunk_id: string;
  document_id: string;
  knowledge_base_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  document_title: string;
  knowledge_base_name: string;
  similarity: number;
  score?: number | null;
  keyword_match?: boolean | null;
};

/** RAG 检索响应（契约 SearchResponse） */
export type RAGSearchResponse = {
  query: string;
  results: RAGSearchResult[];
  total_count: number;
  response_time_ms: number;
};

/** 401/403 时是否因「未认证」而非「密钥无效」：引导用户到门禁页 */
export function isAuthRequired(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}
