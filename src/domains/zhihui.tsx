import { useEffect, useState } from "react";
import { api, getApiKey, guardianErrorLine, maskKey } from "../lib/api";
import { Bind, FamilyBadge, Page, Status } from "./shared";
import type { PageConfig } from "./shared";

/** 智云·守护域 · 信任边界（门禁闭环：ping 预检 + 家人化话术 + Key 掩码） */
export function Security({ page }: { page: PageConfig }) {
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(true);
  const [phase, setPhase] = useState<"idle" | "verifying" | "trusted" | "rejected">("idle");
  const [message, setMessage] = useState("GET /healthz 未检测");
  const [storedKey, setStoredKey] = useState(() => getApiKey());

  const connect = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setPhase("verifying");
    setMessage("正在校验密钥…");
    // 门禁策略：sessionStorage 默认；勾选「记住」时同步 localStorage
    window.sessionStorage.setItem("yyc3_api_key", trimmed);
    if (remember) window.localStorage.setItem("yyc3_api_key", trimmed);
    else window.localStorage.removeItem("yyc3_api_key");
    try {
      const ok = await api.ping();
      if (ok) {
        setPhase("trusted");
        setMessage("信任已建立，欢迎回家");
        setStoredKey(trimmed);
        setKey("");
      } else {
        setPhase("rejected");
        setMessage("门禁未响应：/v1/ping 不可达");
      }
    } catch (err) {
      // 401/403 家人化话术（v5.1 §1.6）
      setPhase("rejected");
      setMessage(guardianErrorLine(err));
      window.sessionStorage.removeItem("yyc3_api_key");
      window.localStorage.removeItem("yyc3_api_key");
      setStoredKey("");
    }
  };

  const disconnect = () => {
    window.sessionStorage.removeItem("yyc3_api_key");
    window.localStorage.removeItem("yyc3_api_key");
    setStoredKey("");
    setPhase("idle");
    setMessage("密钥已清除 · 门禁复位");
  };

  return (
    <Page page={page}>
      <div className="connect-card">
        <FamilyBadge owner="zhihui" full />
        <h2>尚未建立信任，请出示密钥</h2>
        <p>
          密钥仅保存在此设备
          {remember ? "（localStorage · 记住此设备）" : "（sessionStorage · 关闭即失效）"}：
          <span className="mono">yyc3_api_key</span>
        </p>
        {storedKey ? (
          <div className="key-masked mono">
            当前密钥：<b>{maskKey(storedKey)}</b>
          </div>
        ) : null}
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && connect()}
          placeholder="X-API-Key"
          disabled={phase === "verifying"}
        />
        <label className="remember-row">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          记住此设备
        </label>
        <div className="connect-actions">
          <button
            className="primary"
            onClick={connect}
            disabled={!key.trim() || phase === "verifying"}
          >
            {phase === "verifying" ? "验证中…" : "连接"}
          </button>
          {storedKey ? (
            <button className="danger" onClick={disconnect}>
              断开并清除
            </button>
          ) : null}
        </div>
        <Status tone={phase === "trusted" ? "ok" : phase === "rejected" ? "warn" : "muted"}>
          {message}
        </Status>
        <Bind>GET /v1/ping · 401/403 → 门禁话术</Bind>
      </div>
    </Page>
  );
}
