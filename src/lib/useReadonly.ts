import { useCallback, useEffect, useRef, useState } from "react";
import { type ApiError } from "./api";

/**
 * 千行·宗师（质量域）· 只读端点轮询内核
 * 语义对齐文档02 §1.4 qk.* Query Key 体系（Phase 1 无 TanStack Query，自研最小实现）
 * - 需认证端点：key 缺失 → gate="locked"（不请求）
 * - 401/403 → gate="locked"（密钥失效，引导回门禁页）
 * - 网络失败 → 重试至 maxRetries 后 gate="offline"
 */
export interface ReadonlyState<T> {
  data: T | null;
  error: ApiError | Error | null;
  loading: boolean;
  /** locked=需出示密钥 · offline=网络不可达 · open=正常 */
  gate: "open" | "locked" | "offline";
  updatedAt?: number;
}

export function useReadonly<T>(
  fetcher: () => Promise<T>,
  options: { intervalMs?: number; enabled?: boolean; maxRetries?: number } = {},
): ReadonlyState<T> & { refresh: () => void } {
  const { intervalMs = 15_000, enabled = true, maxRetries = 2 } = options;
  const [state, setState] = useState<ReadonlyState<T>>({
    data: null,
    error: null,
    loading: enabled,
    gate: enabled ? "open" : "locked",
  });
  const retriesRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => {
    void fetcherRef;
    const run = async () => {
      try {
        const data = await fetcherRef.current();
        retriesRef.current = 0;
        setState({
          data,
          error: null,
          loading: false,
          gate: "open",
          updatedAt: Date.now(),
        });
      } catch (err) {
        const e = err as ApiError;
        const status = e?.status;
        if (status === 401 || status === 403) {
          setState({ data: null, error: e, loading: false, gate: "locked" });
          return;
        }
        retriesRef.current += 1;
        if (retriesRef.current > maxRetries) {
          setState({
            data: null,
            error: e,
            loading: false,
            gate: "offline",
          });
        } else {
          setState((s) => ({ ...s, loading: true, error: e }));
        }
      }
    };
    void run();
  }, [maxRetries]);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false, gate: "locked" });
      return;
    }
    refresh();
    if (!intervalMs) return;
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, refresh]);

  return { ...state, refresh };
}
