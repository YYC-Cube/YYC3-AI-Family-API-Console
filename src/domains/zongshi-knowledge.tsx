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
      <Panel title="检索与问答" binding="POST /v1/rag/search · POST /v1/rag/ask">
        <div className="dropzone">
          拖入文档或 <button>选择文件</button>
          <small>POST /v1/documents/upload</small>
        </div>
      </Panel>
    </Page>
  );
}
