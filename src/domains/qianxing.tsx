import { useEffect, useState } from "react";
import { useReadonly } from "../lib/useReadonly";
import { api, guardianErrorLine, getApiKey } from "../lib/api";
import { Bind, Empty, FamilyBadge, Page, Panel } from "./shared";
import type { PageConfig } from "./shared";

/** 言启·千行域 · 路径之眼（路由策略序列 + 上游池快照 · 只读 30s 轮询） */
export function Routing({ page }: { page: PageConfig }) {
  const routerStats = useReadonly(() => api.routerStats(), {
    intervalMs: 30_000,
  });
  const [hasKey, setHasKey] = useState(() => Boolean(getApiKey()));
  // 门禁页存/清 Key 后回到本页时自动重查
  useEffect(() => {
    const id = setInterval(() => setHasKey(Boolean(getApiKey())), 1_500);
    return () => clearInterval(id);
  }, []);
  const authed = hasKey && routerStats.gate === "open";
  // 从 stats 扁平对象提取策略计数与上游池（宽松解析，契约未定 schema）
  const raw = (routerStats.data ?? {}) as Record<string, unknown>;
  const strategies = Object.entries(raw)
    .filter(([, v]) => typeof v === "number")
    .slice(0, 5)
    .map(([k, v], i) => ({ name: k, count: v as number, i }));
  const upstreams = Object.entries(raw)
    .filter(([, v]) => typeof v === "object" && v !== null)
    .slice(0, 8);

  return (
    <Page page={page}>
      {!hasKey && (
        <div className="notice">
          统计端点需出示密钥 — 请先前往 <b>安全 · 门禁</b> 页连接。
        </div>
      )}
      {routerStats.gate === "offline" && (
        <div className="notice">
          上游不可达：{guardianErrorLine(routerStats.error)} · 30s 自动重试
        </div>
      )}
      <div className="notice">
        路由策略为网关内置五种枚举，规则 CRUD <span className="phase-mini">Phase 2</span> 开放。
      </div>
      <div className="route-grid">
        <Panel title="策略序列" binding="GET /v1/router/stats">
          {authed && strategies.length > 0 ? (
            <div className="policy-list">
              {strategies.map(({ name, count, i }) => (
                <div key={name}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {name}
                  <i />
                  <em className="mono">{String(count)}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="policy-list">
              {["ADAPTIVE", "WEIGHTED_LATENCY", "LEAST_CONNECTIONS", "RANDOM", "ROUND_ROBIN"].map(
                (v, i) => (
                  <div key={v}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {v}
                    <i />
                  </div>
                ),
              )}
            </div>
          )}
        </Panel>
        <Panel title="上游池快照" binding="GET /v1/router/stats">
          {authed && upstreams.length > 0 ? (
            <div className="upstream-pool">
              {upstreams.map(([name, val]) => (
                <div className="upstream-row mono" key={name}>
                  <b>{name}</b>
                  <span>{JSON.stringify(val).slice(0, 60)}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              owner="qianxing"
              text={hasKey ? "等待上游池快照；路径将在此展开。" : "出示密钥后，上游池将在此展开。"}
            />
          )}
        </Panel>
      </div>
    </Page>
  );
}
