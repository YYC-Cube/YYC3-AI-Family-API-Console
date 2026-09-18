import { useEffect, useState } from "react"
import {
  defaultBranding,
  loadBranding,
  saveBranding,
  type BrandingConfig,
} from "../config/branding"
import logoCyan from "../imports/512.png"
import logoGold from "../imports/icon_512x512.png"
import logoWhite from "../imports/yanyu_cloud_512x512.png"
import { Page, Panel, SectionTitle, Status } from "./shared"
import type { PageConfig } from "./shared"

/** 创想·灵韵域 · 品牌脉冲（本地实时预览 + localStorage 持久化） */
export function Branding({ page }: { page: PageConfig }) {
  const [config, setConfig] = useState<BrandingConfig>(loadBranding)
  const [english, setEnglish] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    document.title = config.seo.title
  }, [config.seo.title])
  const update = (key: "primary" | "secondary", value: string) =>
    setConfig((c) => ({
      ...c,
      slogan: { ...c.slogan, [key]: { ...c.slogan[key], zh: value } },
    }))
  const reset = () => {
    setConfig(defaultBranding)
    saveBranding(defaultBranding)
    setSaved(true)
  }
  return (
    <Page page={page}>
      <div className="brand-studio">
        <section className="brand-preview">
          <span className="preview-label mono">LIVE BRAND PREVIEW</span>
          <img src={logoCyan} alt="YanYu Cloud³ cyan logo" />
          <h2>
            {english ? config.slogan.primary.en : config.slogan.primary.zh}
          </h2>
          <p>
            {english ? config.slogan.secondary.en : config.slogan.secondary.zh}
          </p>
          <span className="mono">{config.seo.title}</span>
        </section>
        <section className="brand-form">
          <SectionTitle>BRANDING CONFIGURATION</SectionTitle>
          <label>
            主标语 / 中文
            <input
              value={config.slogan.primary.zh}
              onChange={(e) => update("primary", e.target.value)}
            />
          </label>
          <label>
            副标语 / 中文
            <input
              value={config.slogan.secondary.zh}
              onChange={(e) => update("secondary", e.target.value)}
            />
          </label>
          <label>
            页面标题
            <input
              value={config.seo.title}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  seo: { ...c.seo, title: e.target.value },
                }))
              }
            />
          </label>
          <div className="form-row">
            <button
              className={`lang ${!english ? "selected" : ""}`}
              onClick={() => setEnglish(false)}
            >
              中文预览
            </button>
            <button
              className={`lang ${english ? "selected" : ""}`}
              onClick={() => setEnglish(true)}
            >
              English
            </button>
            <button
              className="primary"
              onClick={() => {
                saveBranding(config)
                setSaved(true)
              }}
            >
              保存更改
            </button>
          </div>
          {saved && (
            <Status tone="ok">已保存至 localStorage / yyc3-branding</Status>
          )}
          <button className="reset-brand" onClick={reset}>
            恢复默认品牌配置
          </button>
          <p className="form-note">
            {config.contact.email} · {config.contact.website}
          </p>
        </section>
      </div>
      <div className="brand-assets">
        <Panel title="Logo Assets" binding="PNG / transparent background">
          <img src={logoGold} alt="YanYu Cloud³ gold logo" />
          <img src={logoCyan} alt="YanYu Cloud³ cyan logo" />
          <img src={logoWhite} alt="YanYu Cloud³ white logo" />
        </Panel>
      </div>
    </Page>
  )
}
