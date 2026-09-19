import { useState } from "react";
import { Bind, FamilyBadge, SectionTitle } from "./shared";

/** 智云·守护域 · 错误流与告警日志（Phase 1 展示层 · /v1/gateway/errors 待开放） */
export function ErrorStreamFeed() {
  const [filter, setFilter] = useState<"ALL" | "5XX" | "4XX" | "TIMEOUT">("ALL");
  const errors = [
    {
      id: "err-1",
      time: "16:04:12",
      code: 502,
      category: "5XX",
      type: "Upstream Timeout",
      target: "zhipu/glm-4-flash",
      msg: "Upstream socket connection timeout (30000ms)",
      duration: "30.0s",
    },
    {
      id: "err-2",
      time: "15:58:03",
      code: 429,
      category: "4XX",
      type: "Rate Limit Exceeded",
      target: "openai/gpt-4o",
      msg: "Requests per minute (RPM) threshold hit on upstream",
      duration: "12ms",
    },
    {
      id: "err-3",
      time: "15:42:19",
      code: 503,
      category: "5XX",
      type: "Service Unavailable",
      target: "ollama/llama3.3-70b",
      msg: "Ollama local node unreachable (connection refused)",
      duration: "450ms",
    },
    {
      id: "err-4",
      time: "15:10:44",
      code: 401,
      category: "4XX",
      type: "Unauthorized Request",
      target: "GET /v1/models",
      msg: "Invalid or missing X-API-Key authentication token",
      duration: "4ms",
    },
    {
      id: "err-5",
      time: "14:22:01",
      code: 504,
      category: "TIMEOUT",
      type: "Gateway Timeout",
      target: "deepseek/deepseek-r1",
      msg: "Reasoning token generation stream interrupted",
      duration: "60.0s",
    },
  ];

  const filtered =
    filter === "ALL"
      ? errors
      : errors.filter(
          (e) => e.category === filter || (filter === "TIMEOUT" && e.type.includes("Timeout")),
        );

  return (
    <article className="home-panel error-stream-panel">
      <div className="panel-header">
        <div className="header-badge-group">
          <FamilyBadge owner="zhihui" />
          <SectionTitle action={<Bind>GET /v1/gateway/errors</Bind>}>错误流与告警日志</SectionTitle>
        </div>
        <div className="error-filters mono">
          {(["ALL", "5XX", "4XX", "TIMEOUT"] as const).map((f) => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
              {f === "ALL"
                ? `全部 (${errors.length})`
                : f === "5XX"
                  ? "5xx 服务端"
                  : f === "4XX"
                    ? "4xx 客户端"
                    : "超时熔断"}
            </button>
          ))}
        </div>
      </div>
      <div className="error-feed">
        {filtered.map((e) => (
          <div className="error-row" key={e.id}>
            <div className="error-meta mono">
              <span className={`error-code code-${Math.floor(e.code / 100)}x`}>{e.code}</span>
              <span className="error-time">{e.time}</span>
            </div>
            <div className="error-content">
              <div className="error-title-row">
                <strong>{e.type}</strong>
                <span className="error-target mono">{e.target}</span>
              </div>
              <p className="error-msg">{e.msg}</p>
            </div>
            <span className="error-duration mono">{e.duration}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
