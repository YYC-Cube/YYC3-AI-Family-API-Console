import { useEffect, useState } from "react";
import { api, getApiKey, guardianErrorLine } from "../lib/api";
import { useReadonly } from "../lib/useReadonly";
import type { PageConfig } from "./shared";
import { Empty, MetricPlaceholder, Page, Panel, Status } from "./shared";

/** 格物·宗师域 · 格物之阁（知识库 / 文档检索 · 9 端点，真数据接入 Phase 2） */
export function Knowledge({ page }: { page: PageConfig }) {
  const kb = useReadonly(() => api.knowledgeBases(), { intervalMs: 30_000 });
  const [hasKey, setHasKey] = useState(() => Boolean(getApiKey()));
  useEffect(() => {
    const id = setInterval(() => setHasKey(Boolean(getApiKey())), 1_500);
    return () => clearInterval(id);
  }, []);

  const totalDocs = (kb.data ?? []).reduce((a, b) => a + b.document_count, 0);
  const totalTokens = (kb.data ?? []).reduce((a, b) => a + b.total_tokens, 0);
  const locked = !hasKey || kb.gate === "locked";

  return (
    <Page page={page}>
      {locked && (
        <div className="notice">
          知识库端点需出示密钥 — 请先前往 <b>安全 · 门禁</b> 页连接。
        </div>
      )}
      {kb.gate === "offline" && (
        <div className="notice">上游不可达：{guardianErrorLine(kb.error)} · 30s 自动重试</div>
      )}
      <div className="content-grid">
        <Panel title="知识库总数" binding="GET /v1/knowledge-bases">
          {kb.data != null ? (
            <div className="metric-live">
              <strong className="mono">{kb.data.length}</strong>
              <span>knowledge bases</span>
              <Status tone="ok">LIVE · 30s 轮询</Status>
            </div>
          ) : (
            <MetricPlaceholder label="knowledge bases" />
          )}
        </Panel>
        <Panel title="文档与 Token" binding="GET /v1/documents">
          {kb.data != null ? (
            <div className="metric-live">
              <strong className="mono">
                {totalDocs} / {totalTokens.toLocaleString()}
              </strong>
              <span>docs / tokens（Σ 知识库聚合）</span>
              <Status tone="ok">LIVE</Status>
            </div>
          ) : (
            <MetricPlaceholder label="docs / tokens" />
          )}
        </Panel>
      </div>
      <Panel title="知识库清单" binding="GET /v1/knowledge-bases">
        {kb.data != null && kb.data.length > 0 ? (
          <ul className="check-list">
            {kb.data.map((k) => (
              <li key={k.id}>
                <span>{k.icon || "📚"}</span>
                {k.name}
                <em>
                  {k.document_count} docs · {k.total_tokens.toLocaleString()} tok ·{" "}
                  {k.embedding_model} · {k.status}
                </em>
              </li>
            ))}
          </ul>
        ) : (
          <Empty owner="zongshi" text="知识库尚无内容，请上传第一份文档" />
        )}
      </Panel>
      <RagSearchPanel kbIds={(kb.data ?? []).map((k) => k.id)} disabled={locked} />
      <Panel title="文档上传" binding="POST /v1/documents/upload">
        <div className="dropzone">
          拖入文档或 <button>选择文件</button>
          <small>POST /v1/documents/upload</small>
        </div>
      </Panel>
    </Page>
  );
}

/** RAG 检索面板：POST /v1/rag/search 真接入（契约 SearchRequest/SearchResponse） */
function RagSearchPanel({ kbIds, disabled }: { kbIds: string[]; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [searchType, setSearchType] = useState<"semantic" | "hybrid">("semantic");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.ragSearch>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 知识库清单到达后默认全选
  useEffect(() => {
    setSelected((prev) => (prev.length ? prev : kbIds));
  }, [kbIds]);

  const toggleKb = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < kbIds.length
          ? [...prev, id]
          : prev,
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || selected.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.ragSearch({
        query: query.trim(),
        knowledge_base_ids: selected,
        top_k: topK,
        search_type: searchType,
      });
      setResult(r);
    } catch (err) {
      setResult(null);
      setError(guardianErrorLine(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="检索与问答" binding="POST /v1/rag/search · POST /v1/rag/ask">
      <form className="rag-form" onSubmit={submit}>
        <div className="form-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入检索文本，如：网关限流策略"
            aria-label="检索文本"
            disabled={disabled}
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "semantic" | "hybrid")}
            aria-label="检索类型"
            disabled={disabled}
          >
            <option value="semantic">semantic · 向量</option>
            <option value="hybrid">hybrid · 混合</option>
          </select>
          <select
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            aria-label="返回数量"
            disabled={disabled}
          >
            {[3, 5, 10, 20].map((n) => (
              <option key={n} value={n}>
                top_k={n}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={disabled || busy || !query.trim() || selected.length === 0}
          >
            {busy ? "检索中…" : "检索"}
          </button>
        </div>
        {kbIds.length > 0 && (
          <div className="rag-kb-row" role="group" aria-label="选择知识库">
            {kbIds.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip ${selected.includes(id) ? "selected" : ""}`}
                onClick={() => toggleKb(id)}
                disabled={disabled}
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </form>
      {error && <div className="notice">{error}</div>}
      {result && (
        <div className="rag-results">
          <div className="rag-meta mono">
            {result.total_count} chunks · {result.response_time_ms}ms · {result.query}
          </div>
          {result.results.length > 0 ? (
            <ul className="rag-list">
              {result.results.map((r) => (
                <li key={r.chunk_id}>
                  <div className="rag-item-head">
                    <b>{r.document_title}</b>
                    <span className="mono">
                      sim {r.similarity.toFixed(3)}
                      {r.keyword_match != null && ` · kw ${r.keyword_match ? "✓" : "—"}`}
                    </span>
                  </div>
                  <p>{r.content}</p>
                  <small className="mono">
                    {r.knowledge_base_name} · chunk #{r.chunk_index} · {r.token_count} tok
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty owner="zongshi" text="无匹配分块 — 尝试降低 threshold 或切换 hybrid" />
          )}
        </div>
      )}
    </Panel>
  );
}
