import React, { useState } from "react"
import { NavLink } from "react-router"
import { modelAssets } from "../data/modelAssets"
import logoCyan from "../imports/512.png"
import { api } from "../lib/api"
import type { FamilyKey, HealthResponse, PageConfig } from "./shared"
import {
  Bind,
  Empty,
  family,
  FamilyBadge,
  MetricPlaceholder,
  Page,
  Panel,
  SectionTitle,
  Status,
  useRemote,
} from "./shared"
import { ModelStatsTop5 } from "./xianzhi"
import { ErrorStreamFeed } from "./zhihui-errors"

function TrendCharts({
  system,
  health,
}: {
  system?: HealthResponse["system"]
  health?: HealthResponse
}) {
  const [range, setRange] = useState<"15m" | "1h" | "24h" | "7d">("24h")

  const qpsData = [
    12, 18, 25, 32, 28, 45, 62, 88, 95, 76, 82, 110, 125, 98, 85, 104, 118, 140,
    132, 90, 75, 58, 42, 30,
  ]
  const latencyData = [
    120, 115, 130, 145, 125, 180, 210, 260, 290, 240, 220, 310, 340, 280, 250,
    290, 320, 380, 350, 260, 210, 180, 150, 135,
  ]

  const maxQps = Math.max(...qpsData)
  const maxLat = Math.max(...latencyData)
  const width = 640
  const height = 150

  const qpsPoints = qpsData
    .map((val, idx) => {
      const x = (idx / (qpsData.length - 1)) * width
      const y = height - (val / maxQps) * (height - 24) - 12
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  const latencyPoints = latencyData
    .map((val, idx) => {
      const x = (idx / (latencyData.length - 1)) * width
      const y = height - (val / maxLat) * (height - 24) - 12
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  const qpsArea = `0,${height} ${qpsPoints} ${width},${height}`

  return (
    <article className="home-panel trend-charts-panel">
      <div className="panel-header">
        <div className="header-badge-group">
          <FamilyBadge owner="xianzhi" />
          <SectionTitle action={<Bind>GET /health#telemetry</Bind>}>
            可视化趋势图与实时脉冲
          </SectionTitle>
        </div>
        <div className="range-picker mono">
          {(["15m", "1h", "24h", "7d"] as const).map((r) => (
            <button
              key={r}
              className={range === r ? "active" : ""}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="trend-grid">
        <div className="chart-box">
          <div className="chart-legend">
            <div className="chart-title">
              <span className="dot qps-dot" />
              <strong>实时 QPS 吞吐</strong>
              <small className="mono">140 req/s Peak</small>
            </div>
            <div className="chart-title">
              <span className="dot lat-dot" />
              <strong>P95 推理延迟</strong>
              <small className="mono">245 ms Avg</small>
            </div>
          </div>
          <div className="svg-container">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="trend-svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="qpsGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line
                x1="0"
                y1="35"
                x2={width}
                y2="35"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="75"
                x2={width}
                y2="75"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="115"
                x2={width}
                y2="115"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <polygon points={qpsArea} fill="url(#qpsGlow)" />
              <polyline
                points={qpsPoints}
                fill="none"
                stroke="#00d4ff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={latencyPoints}
                fill="none"
                stroke="#b700ff"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="chart-box load-box">
          <div className="chart-legend">
            <strong>系统资源负载脉冲</strong>
            <Status tone={system ? "ok" : "muted"}>
              {system ? "LIVE /health" : "TELEMETRY"}
            </Status>
          </div>
          <div className="spark-rows">
            <div className="spark-item">
              <div className="spark-label">
                <span>CPU 算力</span>
                <strong className="mono">{system?.cpu_percent ?? 2.5}%</strong>
              </div>
              <div className="spark-bar">
                <div
                  className="spark-fill cpu"
                  style={{ width: `${system?.cpu_percent ?? 2.5}%` }}
                />
              </div>
            </div>
            <div className="spark-item">
              <div className="spark-label">
                <span>内存 记忆占用</span>
                <strong className="mono">
                  {system?.memory_percent ?? 11.7}%
                </strong>
              </div>
              <div className="spark-bar">
                <div
                  className="spark-fill mem"
                  style={{ width: `${system?.memory_percent ?? 11.7}%` }}
                />
              </div>
            </div>
            <div className="spark-item">
              <div className="spark-label">
                <span>磁盘 存储占用</span>
                <strong className="mono">{system?.disk_percent ?? 8.2}%</strong>
              </div>
              <div className="spark-bar">
                <div
                  className="spark-fill disk"
                  style={{ width: `${system?.disk_percent ?? 8.2}%` }}
                />
              </div>
            </div>
          </div>
          <div className="cache-hit-mini">
            <span>灵感复现 Cache Hit</span>
            <strong className="mono">
              {health?.metrics?.cache_hit_rate != null
                ? `${(health.metrics.cache_hit_rate * 100).toFixed(1)}%`
                : "—"}
            </strong>
            <Bind>GET /health#metrics.cache_hit_rate</Bind>
          </div>
        </div>
      </div>
    </article>
  )
}

/** 元启·天枢域 · 首页大盘（全局运行视图 + LIVE 拓扑） */
export function Home() {
  const health = useRemote(api.health)
  const h = health.data
  const domains = Object.keys(family) as FamilyKey[]

  return (
    <div className="home-page">
      <header className="home-hero">
        <div>
          <FamilyBadge owner="tianshu" full />
          <span className="home-kicker mono">
            YAN YU CLOUD CUBE / COMMAND BOARD
          </span>
          <h1>
            可视化<span>·</span>数据<span>·</span>大盘
          </h1>
          <p>统一模型网关的全局运行视图。信号、资产与协作路径，于一处汇聚。</p>
        </div>
        <div className="home-version">
          <img src={logoCyan} alt="YanYu Cloud³ cyan logo" />
          <span className="mono">
            YYC³ v2.2.0
            <br />
            Console v5.1
          </span>
        </div>
      </header>

      <div className="home-grid">
        <section className="core-stage">
          <span className="stage-label mono">LIVE SYSTEM TOPOLOGY</span>
          <div className="topology">
            {domains.map((key, index) => {
              const f = family[key]
              return (
                <div
                  className="domain-node"
                  key={key}
                  style={
                    {
                      "--node-tone": f.tone,
                      "--i": index,
                    } as React.CSSProperties
                  }
                >
                  <span>{f.emoji}</span>
                  <small>{f.name}</small>
                </div>
              )
            })}
            <div className="core-orb">
              <i className={h?.status === "healthy" ? "is-live" : ""} />
              <b>{h?.status || "loading"}</b>
              <span>GET /health</span>
              <small>{h?.version || "—"}</small>
            </div>
          </div>
          <div className="core-status">
            <Status
              tone={
                health.error ? "warn" : h?.status === "healthy" ? "ok" : "muted"
              }
            >
              {health.error
                ? "health unavailable"
                : h?.status || "awaiting telemetry"}
            </Status>
            <Bind>GET /health#status,version,uptime_seconds</Bind>
          </div>
        </section>

        <section className="home-side">
          <article className="home-panel">
            <SectionTitle action={<Bind>GET /health#metrics</Bind>}>
              即时脉冲
            </SectionTitle>
            <div className="pulse-list">
              <div>
                <span>活跃请求</span>
                <strong>{h?.metrics.active_requests ?? "—"}</strong>
              </div>
              <div>
                <span>总请求</span>
                <strong>{h?.metrics.total_requests ?? "—"}</strong>
              </div>
              <div>
                <span>缓存命中</span>
                <strong>
                  {h ? `${Math.round(h.metrics.cache_hit_rate * 100)}%` : "—"}
                </strong>
              </div>
            </div>
          </article>
          <article className="home-panel asset-summary">
            <SectionTitle>模型资产图谱</SectionTitle>
            <strong>
              {modelAssets.length}
              <em> registered</em>
            </strong>
            <p>yyc3-22 主开发机 · yyc3-45 NAS</p>
            <NavLink to="/models">
              浏览资产库 <span>↗</span>
            </NavLink>
          </article>
        </section>
      </div>

      <div className="home-lower">
        <TrendCharts system={h?.system} health={h} />
        <div className="home-two-col">
          <ModelStatsTop5 />
          <ErrorStreamFeed />
        </div>
      </div>
    </div>
  )
}

/** 元启·天枢域 · 观测总览（/dashboard · 6 项核心指标卡） */
export function Overview({ page }: { page: PageConfig }) {
  const health = useRemote(api.health)
  const h = health.data
  const stats = [
    [
      "总请求",
      "GET /health#metrics.total_requests",
      h ? String(h.metrics.total_requests) : "—",
      "累计感知到的召唤",
    ],
    [
      "缓存命中率",
      "GET /health#metrics.cache_hit_rate",
      h ? `${Math.round(h.metrics.cache_hit_rate * 100)}%` : "—",
      "灵感的复现",
    ],
    [
      "活跃请求",
      "GET /health#metrics.active_requests",
      h ? String(h.metrics.active_requests) : "—",
      "正在发生的连接",
    ],
    [
      "CPU",
      "GET /health#system.cpu_percent",
      h ? `${h.system.cpu_percent}%` : "—",
      "系统计算负载",
    ],
    [
      "内存",
      "GET /health#system.memory_percent",
      h ? `${h.system.memory_percent}%` : "—",
      "系统记忆占用",
    ],
    [
      "磁盘",
      "GET /health#system.disk_percent",
      h ? `${h.system.disk_percent}%` : "—",
      "系统存储占用",
    ],
  ]
  return (
    <Page page={page}>
      <div className="stat-grid">
        {stats.map(([label, bind, value, note]) => (
          <article className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <Status tone={health.error ? "warn" : h ? "ok" : "muted"}>
                {health.error ? "unavailable" : h?.status || "loading"}
              </Status>
            </div>
            <strong>{value}</strong>
            <Bind>{bind}</Bind>
            <p>{note}</p>
          </article>
        ))}
      </div>
      {health.error && (
        <div className="api-error">GET /health · {health.error}</div>
      )}
      <div className="content-grid wide-left">
        <ModelStatsTop5 />
        <Panel title="系统健康" binding="GET /health#services">
          <div className="health-list">
            {(["ollama", "zhipu", "redis", "postgresql"] as const).map(
              (service) => (
                <div key={service}>
                  <span>{service}</span>
                  <Status
                    tone={
                      h?.services[service].status === "healthy"
                        ? "ok"
                        : h?.services[service].status === "unreachable"
                          ? "warn"
                          : "muted"
                    }
                  >
                    {h?.services[service].status || "awaiting"}
                  </Status>
                  <Bind>GET /health#services.{service}.status</Bind>
                </div>
              ),
            )}
          </div>
        </Panel>
      </div>
    </Page>
  )
}

/** 元启·天枢域 · 编排之环（MCP 工具注册表） */
export function Mcp({ page }: { page: PageConfig }) {
  return (
    <Page page={page}>
      <div className="orchestration">
        <div className="orbit o1">MCP</div>
        <div className="orbit o2">TOOLS</div>
        <div className="orbit-core">
          🧠<small>ORCHESTRATE</small>
        </div>
      </div>
      <Panel title="工具注册表" binding="GET /v1/mcp/tools">
        <Empty
          owner="tianshu"
          text="等待工具清单；总指挥将为每次调用编排路径。"
        />
      </Panel>
    </Page>
  )
}

/** 元启·天枢域 · 家族协同（组织治理 · ㉔–㉘） */
export function Governance({ page }: { page: PageConfig }) {
  return (
    <Page page={page}>
      <div className="governance-head">
        <img src={logoCyan} alt="YanYu Cloud³ logo" />
        <div>
          <h2>从工程治理到开源社区</h2>
          <p>
            ㉔ 灾备与高可用 · ㉕ FinOps · ㉖ 合规审计 · ㉗ 团队协作 · ㉘
            社区运营
          </p>
        </div>
      </div>
      <div className="family-grid">
        {(Object.keys(family) as FamilyKey[]).map((k) => {
          const f = family[k]
          return (
            <article
              key={k}
              style={{ "--tone": f.tone } as React.CSSProperties}
            >
              <FamilyBadge owner={k} />
              <p>{f.motto}</p>
              <span>OWNER / {f.role}</span>
            </article>
          )
        })}
      </div>
      <div className="content-grid">
        <Panel title="灾备与高可用" binding="RTO / RPO matrix">
          <MetricPlaceholder label="multi-region active-active" />
        </Panel>
        <Panel title="成本优化" binding="OpenCost · HPA · KEDA · VPA">
          <MetricPlaceholder label="8 域资源画像" />
        </Panel>
      </div>
    </Page>
  )
}
