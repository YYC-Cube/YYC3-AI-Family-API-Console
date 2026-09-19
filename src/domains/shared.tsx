import React, { useEffect, useState } from "react";
import type { HealthResponse, ModelConfig } from "../lib/api";

/** 8 家人命名空间（v5.1 拟人化体系） */
export type FamilyKey =
  | "zhihui"
  | "qianxing"
  | "bole"
  | "wanyu"
  | "zongshi"
  | "tianshu"
  | "xianzhi"
  | "lingyun";

export type PageConfig = {
  path: string;
  nav: string;
  title: string;
  subtitle: string;
  family: FamilyKey;
  domain: string;
  alignment: string;
};

export const family: Record<
  FamilyKey,
  {
    emoji: string;
    name: string;
    role: string;
    phone: string;
    tone: string;
    motto: string;
  }
> = {
  zhihui: {
    emoji: "🛡️",
    name: "智云·守护",
    role: "首席安全官",
    phone: "0379-0207",
    tone: "#22c55e",
    motto: "门不开则万法不侵，钥不实则寸步难行",
  },
  qianxing: {
    emoji: "🧭",
    name: "言启·千行",
    role: "首席导航员",
    phone: "0379-0106",
    tone: "#00d4ff",
    motto: "一言既出，千行可至",
  },
  bole: {
    emoji: "🎯",
    name: "千里·伯乐",
    role: "首席推荐官",
    phone: "0379-0109",
    tone: "#f59e0b",
    motto: "千里马常有，而伯乐不常有",
  },
  wanyu: {
    emoji: "🤔",
    name: "语枢·万物",
    role: "首席思考者",
    phone: "0379-0107",
    tone: "#c0c0c0",
    motto: "语枢一启，万物皆明",
  },
  zongshi: {
    emoji: "📚",
    name: "格物·宗师",
    role: "首席质量官",
    phone: "0379-0208",
    tone: "#2e8b57",
    motto: "格物致知，诚意正心",
  },
  tianshu: {
    emoji: "🧠",
    name: "元启·天枢",
    role: "总指挥",
    phone: "0379-0206",
    tone: "#b700ff",
    motto: "人从众曌众从人",
  },
  xianzhi: {
    emoji: "🔮",
    name: "预见·先知",
    role: "首席预言家",
    phone: "0379-0108",
    tone: "#00d4ff",
    motto: "见微知著，未卜先知",
  },
  lingyun: {
    emoji: "🎨",
    name: "创想·灵韵",
    role: "首席创意官",
    phone: "0379-0209",
    tone: "#ff8c00",
    motto: "灵韵一至，妙笔生花",
  },
};

export const pages: PageConfig[] = [
  {
    path: "/dashboard",
    nav: "观测总览",
    title: "今日预言",
    subtitle: "服务的每一次呼吸，都应被看见。",
    family: "xianzhi",
    domain: "观测与预测域",
    alignment: "✅ 4 端点聚合",
  },
  {
    path: "/models",
    nav: "模型中枢",
    title: "知遇之殿",
    subtitle: "为每一个任务，寻找最合适的模型。",
    family: "bole",
    domain: "模型市场域",
    alignment: "✅ 直接对接",
  },
  {
    path: "/playground",
    nav: "推理实验场",
    title: "洞察之厅",
    subtitle: "调试一次推理，读懂一次路径。",
    family: "wanyu",
    domain: "推理对话域",
    alignment: "✅ SSE 直接对接",
  },
  {
    path: "/routing",
    nav: "路由观察",
    title: "路径之眼",
    subtitle: "每条请求都有一条可解释的来路。",
    family: "qianxing",
    domain: "路由与网关域",
    alignment: "✅ 只读对接",
  },
  {
    path: "/knowledge",
    nav: "知识与 RAG",
    title: "格物之阁",
    subtitle: "让每一个答案都有可追溯的出处。",
    family: "zongshi",
    domain: "知识与质量域",
    alignment: "✅ 9 端点",
  },
  {
    path: "/mcp",
    nav: "MCP 工具",
    title: "编排之环",
    subtitle: "工具在合适的时刻，成为可控的能力。",
    family: "tianshu",
    domain: "工具与编排域",
    alignment: "✅ 14 个 /v1/mcp/* 端点",
  },
  {
    path: "/cache",
    nav: "缓存管理",
    title: "灵感缓存",
    subtitle: "把重复的灵感，变成稳定的体验。",
    family: "lingyun",
    domain: "缓存与体验域",
    alignment: "✅ 直接对接",
  },
  {
    path: "/monitor",
    nav: "质量与运维",
    title: "质量脉冲",
    subtitle: "将每次发布、告警与演练收进同一条证据链。",
    family: "xianzhi",
    domain: "质量与运维域",
    alignment: "📋 Phase 2 · BL-06",
  },
  {
    path: "/security",
    nav: "安全设置",
    title: "信任边界",
    subtitle: "密钥只在受信任的设备和链路中流动。",
    family: "zhihui",
    domain: "接入与安全域",
    alignment: "✅ /healthz 免认证",
  },
  {
    path: "/branding",
    nav: "品牌设置",
    title: "品牌脉冲",
    subtitle: "让每一次界面出现，都带着清晰的身份。",
    family: "lingyun",
    domain: "品牌与体验域",
    alignment: "✅ 本地实时预览",
  },
  {
    path: "/governance",
    nav: "治理与交付",
    title: "家族协同",
    subtitle: "从可靠性到社区，所有责任均有归属。",
    family: "tianshu",
    domain: "组织治理域",
    alignment: "📋 ㉔–㉘ 交付系统",
  },
];

/* ── 共享 UI 原语 ── */

export function FamilyBadge({ owner, full = false }: { owner: FamilyKey; full?: boolean }) {
  const f = family[owner];
  return (
    <div
      data-family={owner === "qianxing" ? "qianhang" : owner}
      className="family-badge mono"
      style={{ "--tone": f.tone } as React.CSSProperties}
    >
      <span>{f.emoji}</span>
      <span>{f.name}</span>
      {full && (
        <span className="badge-detail">
          · {f.role} · {f.phone}
        </span>
      )}
    </div>
  );
}

export function Bind({ children }: { children: React.ReactNode }) {
  return <span className="bind mono">[BIND:{children}]</span>;
}

export function PageHeader({ page }: { page: PageConfig }) {
  const f = family[page.family];
  return (
    <header className="page-header">
      <div>
        <FamilyBadge owner={page.family} full />
        <h1>{page.title}</h1>
        <p>「{f.motto}」</p>
      </div>
      <div className="header-side">
        <span>{page.domain}</span>
        <b>{page.alignment}</b>
      </div>
    </header>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <span className="mono">{children}</span>
      {action}
    </div>
  );
}

export function Status({
  children,
  tone = "ok",
}: {
  children: React.ReactNode;
  tone?: "ok" | "muted" | "warn";
}) {
  return (
    <span className={`status ${tone}`}>
      <i />
      {children}
    </span>
  );
}

export function Panel({
  title,
  binding,
  children,
}: {
  title: string;
  binding: string;
  children: React.ReactNode;
}) {
  return (
    <article className="panel">
      <SectionTitle action={<Bind>{binding}</Bind>}>{title}</SectionTitle>
      {children}
    </article>
  );
}

export function Page({ page, children }: { page: PageConfig; children: React.ReactNode }) {
  return (
    <div className="page">
      <PageHeader page={page} />
      {children}
    </div>
  );
}

export function MetricPlaceholder({ label }: { label: string }) {
  return (
    <div className="metric-placeholder">
      <strong>—</strong>
      <span>{label}</span>
      <Status tone="muted">awaiting</Status>
    </div>
  );
}

export function CheckList({ labels }: { labels: string[] }) {
  return (
    <ul className="check-list">
      {labels.map((x) => (
        <li key={x}>
          <span>✓</span>
          {x}
          <em>ready</em>
        </li>
      ))}
    </ul>
  );
}

export function Empty({ owner, text }: { owner: FamilyKey; text: string }) {
  return (
    <div className="empty">
      <FamilyBadge owner={owner} />
      <p>{text}</p>
    </div>
  );
}

export function Phase({ code, text, owner }: { code: string; text: string; owner: FamilyKey }) {
  return (
    <div className="phase">
      <span>📋 {code}</span>
      <p>{text}</p>
      <FamilyBadge owner={owner} />
    </div>
  );
}

export function useRemote<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setState({ data, loading: false }))
      .catch(
        (error) =>
          active &&
          setState({
            error: error instanceof Error ? error.message : "Request failed",
            loading: false,
          }),
      );
    return () => {
      active = false;
    };
  }, [load]);
  return state;
}

export type { HealthResponse, ModelConfig };
