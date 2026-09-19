import { useState } from "react";
import { modelAssets, nimCategories } from "../data/modelAssets";
import { api, type ModelConfig } from "../lib/api";
import type { PageConfig } from "./shared";
import { Bind, Empty, FamilyBadge, Page, Phase, useRemote } from "./shared";

/** 千里·伯乐域 · 知遇之殿（网关实时模型 + 本地/NAS 资产库） */
export function Models({ page }: { page: PageConfig }) {
  const models = useRemote(api.models);
  const [view, setView] = useState<"gateway" | "assets">("gateway");
  return (
    <Page page={page}>
      <div className="model-switch">
        <button className={view === "gateway" ? "active" : ""} onClick={() => setView("gateway")}>
          网关实时模型
        </button>
        <button className={view === "assets" ? "active" : ""} onClick={() => setView("assets")}>
          本地 / NAS 资产库
        </button>
      </div>
      {view === "gateway" ? (
        <>
          <div className="notice">
            上游池动态注入的模型随 <span className="mono">OPENAI_COMPATIBLE_UPSTREAMS</span>{" "}
            实时变化。
          </div>
          <div className="toolbar">
            <div className="filter-chip">
              全部后端 <span>⌄</span>
            </div>
            <div className="filter-chip">
              启用状态 <span>⌄</span>
            </div>
            <div className="filter-chip">
              本地免费 <span>⌄</span>
            </div>
            <Bind>GET /v1/models</Bind>
          </div>
          {models.error && (
            <div className="api-error">
              GET /v1/models · {models.error}。请前往「安全设置」保存 API Key。
            </div>
          )}
          <div className="model-grid">
            {models.loading
              ? [0, 1, 2].map((i) => (
                  <article className="model-card" key={i}>
                    <div className="skeleton-line w1" />
                    <div className="skeleton-line w2" />
                    <div className="skeleton-line w3" />
                  </article>
                ))
              : models.data?.map((model: ModelConfig) => (
                  <ModelItem key={model.id} model={model} />
                ))}
          </div>
          {models.data?.length === 0 && (
            <Empty owner="bole" text="暂无可用模型，请检查 /v1/models" />
          )}
          <Phase code="BL-01" text="更多供应商将经上游池接入" owner="bole" />
        </>
      ) : (
        <AssetInventory />
      )}
    </Page>
  );
}

function ModelItem({ model }: { model: ModelConfig }) {
  return (
    <article className="model-card">
      <FamilyBadge owner="bole" />
      <h3>{model.display_name}</h3>
      <div className="model-meta">
        <span>{model.id}</span>
        <b>{model.backend}</b>
        <span>{model.max_tokens.toLocaleString()} tokens</span>
        <span>{model.enabled ? "enabled" : "disabled"}</span>
      </div>
      <Bind>GET /v1/models#display_name,id,backend,max_tokens,enabled</Bind>
    </article>
  );
}

function AssetInventory() {
  return (
    <>
      <div className="asset-intro">
        <span className="mono">ASSET REGISTRY / USER-PROVIDED INVENTORY</span>
        <p>
          模型资产来自 <strong>NVIDIA-NIM-Models.md</strong> 与主开发机 / NAS
          清单，不代表当前网关已加载或可调用的模型。
        </p>
      </div>
      <div className="nim-grid">
        {nimCategories.map(([name, count]) => (
          <div key={name}>
            <b>{count}</b>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="asset-table">
        <div className="asset-head">
          <span>模型资产</span>
          <span>能力</span>
          <span>存储域</span>
          <span>登记路径</span>
        </div>
        {modelAssets.map((asset) => (
          <div className="asset-row" key={asset.path}>
            <strong>{asset.name}</strong>
            <span>{asset.capability}</span>
            <span>{asset.location}</span>
            <code>{asset.path}</code>
          </div>
        ))}
      </div>
    </>
  );
}
