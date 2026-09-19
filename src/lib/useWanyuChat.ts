import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, getApiKey } from "./api";

/**
 * 语枢·万物 · SSE 七态状态机（v5.1 §1.5 契约）
 * idle → connecting → streaming ⇄ paused / → degraded → done / → error
 * 协议：data: {OpenAI chunk}\n\n · 结束 data: [DONE]\n\n
 * 响应头：X-YYC3-Upstream（实际上游）· X-YYC3-Degraded: true（降级标记）
 * 首 chunk 特殊字段：_yyc3_upstream
 * Token 估算口径：tokens ≈ len(content) // 4
 */
export type ChatPhase =
  | "idle"
  | "connecting"
  | "streaming"
  | "paused"
  | "degraded"
  | "error"
  | "done";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatState {
  phase: ChatPhase;
  /** 已确认的历史消息 */
  messages: ChatMessage[];
  /** 流式缓冲（当前正在生成的 assistant 内容） */
  buffer: string;
  upstream?: string;
  degraded: boolean;
  ttftMs?: number;
  totalMs?: number;
  error?: { message: string; type: string };
  /** 暂停时已接收的字符位置（Phase 1: 恢复时续显本地缓冲） */
  pausedAt?: number;
}

export interface SendParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export function useWanyuChat() {
  const [state, setState] = useState<ChatState>({
    phase: "idle",
    messages: [],
    buffer: "",
    degraded: false,
  });
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef(0);
  /** 最近一次请求参数，供重试/恢复使用 */
  const lastParamsRef = useRef<SendParams | null>(null);
  /** 恢复时携带的已接收内容（继续追加而非清空） */
  const resumeAccRef = useRef("");

  const runStream = useCallback(async (params: SendParams, resumeFrom: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    lastParamsRef.current = params;

    setState((s) => ({
      ...s,
      phase: "connecting",
      buffer: resumeFrom,
      degraded: false,
      error: undefined,
      ttftMs: undefined,
      totalMs: undefined,
      pausedAt: undefined,
    }));
    startedAtRef.current = performance.now();

    try {
      const apiKey = getApiKey();
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ ...params, stream: true }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const detail = errBody?.detail;
        throw Object.assign(new Error(detail?.message ?? `HTTP ${res.status}`), {
          status: res.status,
          type: detail?.error ?? "stream_error",
        });
      }

      const upstream = res.headers.get("X-YYC3-Upstream") ?? undefined;
      const degraded = res.headers.get("X-YYC3-Degraded") === "true";

      setState((s) => ({
        ...s,
        upstream,
        degraded,
        phase: degraded ? "degraded" : s.phase,
      }));

      const reader = res.body?.getReader();
      if (!reader) throw Object.assign(new Error("No reader"), { type: "stream_error" });
      const decoder = new TextDecoder();
      let carry = "";
      let firstByte = !resumeFrom;
      let acc = resumeFrom;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        carry += text;
        const parts = carry.split("\n\n");
        carry = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = part.slice(6).trim();
          if (payload === "[DONE]") {
            setState((s) => ({
              ...s,
              phase: "done",
              totalMs: performance.now() - startedAtRef.current,
              messages: [...s.messages, { role: "assistant" as const, content: acc }],
              buffer: "",
            }));
            return;
          }
          try {
            const chunk = JSON.parse(payload);
            if (chunk.error) {
              setState((s) => ({
                ...s,
                phase: "error",
                error: {
                  message: chunk.error.message ?? "stream error",
                  type: chunk.error.type ?? "stream_error",
                },
              }));
              continue;
            }
            if (chunk._yyc3_upstream && !upstream) {
              setState((s) => ({ ...s, upstream: chunk._yyc3_upstream }));
            }
            const delta: string = chunk?.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              if (firstByte) {
                firstByte = false;
                setState((s) => ({
                  ...s,
                  phase: s.degraded ? "degraded" : "streaming",
                  ttftMs: performance.now() - startedAtRef.current,
                }));
              }
              acc += delta;
              setState((s) => ({ ...s, buffer: acc }));
            }
          } catch {
            /* 跳过畸形 chunk */
          }
        }
      }
      // 流结束但未见 [DONE]：视为完成
      setState((s) =>
        s.phase === "error"
          ? s
          : {
              ...s,
              phase: "done",
              totalMs: performance.now() - startedAtRef.current,
              messages: [...s.messages, { role: "assistant" as const, content: acc }],
              buffer: "",
            },
      );
    } catch (err) {
      const e = err as Error & { status?: number; type?: string };
      if (e.name === "AbortError") {
        // stop() 主动暂停：保留已接收缓冲（paused 态）
        setState((s) => ({
          ...s,
          phase: "paused",
          pausedAt: s.buffer.length,
        }));
        return;
      }
      setState((s) => ({
        ...s,
        phase: "error",
        error: {
          message:
            e.status === 401
              ? "门禁拒绝：401 · API Key 无效或已过期"
              : e.status === 403
                ? "门禁拒绝：403 · 该 Key 无权限访问此端点"
                : e.status === 429
                  ? "限流：请求过于频繁，稍后重试"
                  : e.message,
          type: e.type ?? "stream_error",
        },
      }));
    }
  }, []);

  /** 发送一条用户消息并启动流式推理 */
  const send = useCallback(
    (params: SendParams) => {
      resumeAccRef.current = "";
      setState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            role: "user" as const,
            content: params.messages.at(-1)?.content ?? "",
          },
        ],
      }));
      return runStream(params, "");
    },
    [runStream],
  );

  /** 暂停（AbortController.abort → paused 态，保留缓冲） */
  const stop = useCallback(() => abortRef.current?.abort(), []);

  /** 从已接收位置恢复请求（Phase 1：本地缓冲续显） */
  const resume = useCallback(() => {
    const params = lastParamsRef.current;
    if (!params) return;
    const acc = resumeAccRef.current;
    void runStream(params, acc);
  }, [runStream]);

  /** 错误后重试（清空响应，重新请求） */
  const retry = useCallback(() => {
    const params = lastParamsRef.current;
    if (!params) return;
    void runStream(params, "");
  }, [runStream]);

  /** 重置整个会话 */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    resumeAccRef.current = "";
    lastParamsRef.current = null;
    setState({
      phase: "idle",
      messages: [],
      buffer: "",
      degraded: false,
    });
  }, []);

  /** 卸载时中止进行中的流 */
  useEffect(() => () => abortRef.current?.abort(), []);

  /** 暂停时记录缓冲，供 resume 续显 */
  useEffect(() => {
    if (state.phase === "paused") resumeAccRef.current = state.buffer;
  }, [state.phase, state.buffer]);

  return { state, send, stop, resume, retry, reset };
}
