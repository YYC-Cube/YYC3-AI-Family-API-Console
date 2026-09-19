import { useState } from "react";
import { Bind, CheckList, FamilyBadge, Page, Panel, Phase } from "./shared";
import type { PageConfig } from "./shared";

/** 预见·先知域 · 质量脉冲（QA 自检 / 视觉回归 / 运维观测三视图） */
export function Monitor({ page }: { page: PageConfig }) {
  const [tab, setTab] = useState<"qa" | "visual" | "ops">("qa");
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("尚未在此控制台执行。");
  const run = () => {
    setRunning(true);
    setNote("检查已排队；实际结果由 CI 生成。");
    window.setTimeout(() => setRunning(false), 750);
  };
  const content =
    tab === "qa" ? (
      <div className="ops-grid">
        <Panel title="A11y 审计" binding="axe-core · WCAG 2.2 AA">
          <CheckList
            labels={[
              "无 serious / critical 违规",
              "所有按钮具备可访问名称",
              "PageHeader 使用语义标签",
              "SSE 区使用 aria-live",
            ]}
          />
        </Panel>
        <Panel title="契约与响应式" binding="Playwright · Contract Drift">
          <CheckList
            labels={[
              "端点 Schema 冻结对齐",
              "375 / 768 / 1024 / 1440 断点",
              "触控区 ≥ 44px",
              "深色对比度专项",
            ]}
          />
        </Panel>
        <Panel title="审计执行" binding="reports/a11y/summary.json">
          <div className="runner">
            <p>{note}</p>
            <button className="primary" onClick={run} disabled={running}>
              {running ? "正在排队…" : "运行审计"}
            </button>
          </div>
        </Panel>
      </div>
    ) : tab === "visual" ? (
      <div className="ops-grid visual-grid">
        <Panel title="视觉回归" binding="Playwright screenshot">
          <CheckList
            labels={[
              "8 位 FamilyBadge 基线",
              "Dark / Light 页面快照",
              "响应式基线",
              "组件变体矩阵",
            ]}
          />
        </Panel>
        <Panel title="基线策略" binding="scripts/visual/update.sh">
          <div className="baseline">
            <span>BASELINE</span>
            <strong>需要 CI 首次生成</strong>
            <p>变更应以差异报告审阅后更新。</p>
          </div>
        </Panel>
        <Panel title="差异报告" binding="scripts/visual/diff-report.ts">
          <Phase
            owner="zongshi"
            code="QA-02"
            text="当前仓库未配置 Playwright 与视觉基线，保留交付入口。"
          />
        </Panel>
      </div>
    ) : (
      <div className="ops-grid">
        <Panel title="观测告警" binding="Prometheus + Grafana">
          <CheckList
            labels={[
              "ServiceMonitor · /metrics",
              "8 域告警规则",
              "Alertmanager 家族路由",
              "Grafana 家族总览",
            ]}
          />
        </Panel>
        <Panel title="日志与性能" binding="Loki + React Profiler">
          <CheckList
            labels={[
              "Loki / ELK 日志聚合",
              "8 域性能标记",
              "Core Web Vitals 上报",
              "Long Task Observer",
            ]}
          />
        </Panel>
        <Panel title="K8s 交付" binding="Helm · Karmada · Velero">
          <CheckList
            labels={[
              "Helm Chart 部署",
              "多区域 Active-Active",
              "灾备演练 Runbook",
              "FinOps 资源画像",
            ]}
          />
        </Panel>
      </div>
    );

  return (
    <Page page={page}>
      <div className="quality-tabs">
        {(
          [
            ["qa", "QA 自检"],
            ["visual", "视觉回归"],
            ["ops", "运维观测"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {content}
    </Page>
  );
}
