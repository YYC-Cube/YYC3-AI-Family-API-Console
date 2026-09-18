import { useEffect, useState } from "react"
import { useReadonly } from "../lib/useReadonly"
import { api, guardianErrorLine, getApiKey } from "../lib/api"
import {
  Bind,
  FamilyBadge,
  MetricPlaceholder,
  Page,
  Panel,
  Status,
} from "./shared"
import type { PageConfig } from "./shared"

/** 创想·灵韵域 · 灵感缓存（hit rate / entries 实时轮询 + 失效操作） */
export function Cache({ page }: { page: PageConfig }) {
  const cacheStats = useReadonly(() => api.cacheStats(), { intervalMs: 15_000 })
  const cacheInfo = useReadonly(() => api.cacheInfo(), { intervalMs: 30_000 })
  const [hasKey, setHasKey] = useState(() => Boolean(getApiKey()))
  useEffect(() => {
    const id = setInterval(() => setHasKey(Boolean(getApiKey())), 1_500)
    return () => clearInterval(id)
  }, [])

  const stats = (cacheStats.data ?? {}) as Record<string, unknown>
  const info = (cacheInfo.data ?? {}) as Record<string, unknown>
  const pick = (
    obj: Record<string, unknown>,
    keys: string[],
  ): number | null => {
    for (const k of keys) {
      const v = obj[k]
      if (typeof v === "number") return v
    }
    return null
  }
  const hitRate = pick(stats, [
    "cache_hit_rate",
    "hit_rate",
    "hitRate",
    "overall_hit_rate",
  ])
  const entries = pick(info, [
    "total_entries",
    "entries",
    "cached_entries",
    "total",
  ])
  const locked = !hasKey || cacheStats.gate === "locked"

  return (
    <Page page={page}>
      {locked && (
        <div className="notice">
          统计端点需出示密钥 — 请先前往 <b>安全 · 门禁</b> 页连接。
        </div>
      )}
      {cacheStats.gate === "offline" && (
        <div className="notice">
          上游不可达：{guardianErrorLine(cacheStats.error)} · 15s 自动重试
        </div>
      )}
      <div className="content-grid">
        <Panel title="缓存统计" binding="GET /v1/cache/stats">
          {hitRate != null ? (
            <div className="metric-live">
              <strong className="mono">{(hitRate * 100).toFixed(1)}%</strong>
              <span>cache hit rate</span>
              <Status tone="ok">LIVE · 15s 轮询</Status>
            </div>
          ) : (
            <MetricPlaceholder label="cache hit rate" />
          )}
        </Panel>
        <Panel title="缓存详情" binding="GET /v1/cache/info">
          {entries != null ? (
            <div className="metric-live">
              <strong className="mono">{entries.toLocaleString()}</strong>
              <span>cached entries</span>
              <Status tone="ok">LIVE · 30s 轮询</Status>
            </div>
          ) : (
            <MetricPlaceholder label="cached entries" />
          )}
        </Panel>
      </div>
      <Panel title="失效操作" binding="POST /v1/cache/invalidate/{model}">
        <div className="danger-row">
          <p>清空全部缓存是不可逆操作。</p>
          <button className="danger">DELETE /v1/cache/all</button>
        </div>
      </Panel>
    </Page>
  )
}
