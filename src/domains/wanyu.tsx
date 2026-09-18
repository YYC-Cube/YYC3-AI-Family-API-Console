import { useEffect, useRef, useState } from "react"
import { useWanyuChat } from "../lib/useWanyuChat"
import { Bind, FamilyBadge, Page, SectionTitle } from "./shared"
import type { PageConfig } from "./shared"

/** 语枢·万物域 · 推理实验场（SSE 七态状态机可视化） */
export function Playground({ page }: { page: PageConfig }) {
  const [text, setText] = useState("")
  const [stream, setStream] = useState(true)
  const [temperature, setTemperature] = useState(0.7)
  const chat = useWanyuChat()
  const { state } = chat
  const scrollRef = useRef<HTMLDivElement>(null)
  const streaming =
    state.phase === "streaming" ||
    state.phase === "degraded" ||
    state.phase === "connecting"

  // 新内容到达时滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [state.buffer, state.messages.length])

  const submit = () => {
    const content = text.trim()
    if (!content || streaming) return
    setText("")
    // 流式/非流式统一走 SSE 通道（协议一致，仅展示差异）
    void chat.send({
      model: "auto",
      messages: [{ role: "user", content }],
      temperature,
    })
  }

  return (
    <Page page={page}>
      <div className="playground">
        <aside className="param-panel">
          <SectionTitle>PARAMETERS</SectionTitle>
          <label>
            模型选择
            <select defaultValue="auto">
              <option value="auto">auto（网关自适应路由）</option>
            </select>
          </label>
          <label>
            temperature <b>{temperature.toFixed(1)}</b>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
          </label>
          <label>
            top_p <b>0.9</b>
            <input type="range" min="0" max="1" step="0.1" defaultValue="0.9" />
          </label>
          <label>
            max_tokens
            <input value="4096" readOnly />
          </label>
          <button
            className={`switch ${stream ? "on" : ""}`}
            onClick={() => setStream(!stream)}
          >
            <i />
            stream
          </button>
          <Bind>POST /v1/chat/completions (SSE)</Bind>
        </aside>
        <section className="chat-panel">
          <div className="chat-head">
            <FamilyBadge owner="wanyu" />
            <span className="phase-chip" data-phase={state.phase}>
              {state.phase}
            </span>
          </div>
          {state.messages.length === 0 && !state.buffer ? (
            <div className="chat-empty">
              <span>✦</span>
              <p>语枢一启，万物皆明</p>
              <Bind>POST /v1/chat/completions (SSE) · 七态状态机</Bind>
            </div>
          ) : (
            <div className="chat-stream" ref={scrollRef} aria-live="polite">
              {state.messages.map((m, i) => (
                <div
                  key={i}
                  className={`stream-msg ${m.role === "user" ? "user" : "assistant"}`}
                >
                  {m.content}
                </div>
              ))}
              {(state.buffer || state.phase === "connecting") && (
                <div className="stream-msg assistant">
                  {state.buffer}
                  {(state.phase === "streaming" ||
                    state.phase === "degraded" ||
                    state.phase === "connecting") && (
                    <span className="cursor" />
                  )}
                </div>
              )}
              {state.phase === "paused" && (
                <div className="stream-meta">
                  <span>「已暂停 · 已接收 {state.pausedAt ?? 0} 字符」</span>
                  <button className="secondary" onClick={chat.resume}>
                    继续 ↻
                  </button>
                </div>
              )}
              {state.phase === "error" && state.error && (
                <div className="stream-error">
                  思绪中断：{state.error.type} · {state.error.message}
                  <button onClick={chat.retry}>重试</button>
                </div>
              )}
              {state.phase === "done" && state.totalMs != null && (
                <div className="stream-meta">
                  <span>
                    思考完毕 · ~{(state.messages.at(-1)?.content.length ?? 0) >> 2}{" "}
                    tokens · {Math.round(state.totalMs)}ms
                  </span>
                  {state.ttftMs != null && (
                    <span className="ttft">TTFT {Math.round(state.ttftMs)}ms</span>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="stream-meta">
            {state.upstream && (
              <span className="upstream">◈ upstream: {state.upstream}</span>
            )}
            {state.degraded && (
              <span className="degraded-badge">
                降级路径 ·「原路径受阻，改由 {state.upstream ?? "备选"} 继续思考」
              </span>
            )}
          </div>
          <div className="composer">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder="输入一条消息，开始一次可观测的思考…"
              disabled={streaming}
            />
            {streaming ? (
              <button className="secondary" onClick={chat.stop}>
                停止 ■
              </button>
            ) : (
              <button disabled={!text.trim()} onClick={submit}>
                发送 ↗
              </button>
            )}
          </div>
        </section>
        <aside className="debug-panel">
          <FamilyBadge owner="lingyun" />
          <SectionTitle>REQUEST PREVIEW</SectionTitle>
          <pre>{`{
  "stream": ${stream},
  "temperature": ${temperature.toFixed(1)},
  "max_tokens": 4096
}`}</pre>
          <SectionTitle>TRACE</SectionTitle>
          <div className="trace">
            primary <span>→</span> {state.upstream ?? "awaiting upstream"}
          </div>
          <SectionTitle>PHASE MACHINE</SectionTitle>
          <div className="trace">
            {state.phase}
            {state.ttftMs != null && (
              <>
                <br />
                ttft <span>=</span> {Math.round(state.ttftMs)}ms
              </>
            )}
          </div>
          <Bind>响应头 X-YYC3-Upstream / X-YYC3-Degraded</Bind>
        </aside>
      </div>
    </Page>
  )
}
