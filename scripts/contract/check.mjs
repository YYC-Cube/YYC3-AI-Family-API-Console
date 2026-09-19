#!/usr/bin/env node
/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * @Module : scripts/contract/check.mjs — 契约漂移检测门禁
 * @Family  : YYC³ AI Family · 📚 格物·宗师（质量域）
 * ============================================================
 * 用法:
 *   node scripts/contract/check.mjs           # 漂移检测（对比冻结快照）
 *   node scripts/contract/check.mjs freeze    # 首次冻结 / 人工确认后更新快照
 *
 * 逻辑:
 *   1. 拉取 https://api.0379.world/openapi.json（后端契约实况）
 *   2. 规范化：仅提取端点路径+方法+关键字段（Schema 全量 diff 由后端 openapi hash 承担）
 *   3. sha256 规范化 JSON → 与 contracts/openapi.snapshot.json 对比
 *   4. 漂移 → 退出码 1（CI 阻断）· 一致 → 退出码 0
 * ============================================================
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SNAPSHOT = join(ROOT, "contracts", "openapi.snapshot.json");
const API_BASE = process.env.YYC3_API_BASE ?? "https://api.0379.world";

/** 规范化：压缩无关紧要的字段，保留端点契约骨架 */
function normalize(spec) {
  const paths = {};
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    paths[path] = {};
    for (const [method, op] of Object.entries(methods)) {
      if (typeof op !== "object") continue;
      paths[path][method] = {
        operationId: op.operationId ?? null,
        // 请求体 schema 引用（$ref 骨架）
        requestBody: op.requestBody?.content ? Object.keys(op.requestBody.content) : undefined,
        // 响应骨架：状态码 → schema 引用/类型
        responses: Object.fromEntries(
          Object.entries(op.responses ?? {}).map(([code, r]) => [
            code,
            r?.$ref
              ? { $ref: r.$ref }
              : r?.content
                ? Object.fromEntries(
                    Object.entries(r.content).map(([ct, c]) => [
                      ct,
                      c?.schema?.$ref ? { $ref: c.schema.$ref } : { type: c?.schema?.type ?? null },
                    ]),
                  )
                : { type: null },
          ]),
        ),
      };
    }
  }
  return {
    openapi: spec.openapi ?? null,
    info: { version: spec.info?.version ?? null },
    paths,
    // 顶层 Schema 组件名清单（结构漂移 = 新增/删除组件）
    schemaNames: Object.keys(spec.components?.schemas ?? {}).sort(),
  };
}

function sha(obj) {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

async function fetchSpec() {
  const res = await fetch(`${API_BASE}/openapi.json`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`openapi.json HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const mode = process.argv[2] ?? "check";
  console.log(`📄 [contract] 目标: ${API_BASE}/openapi.json`);

  const spec = await fetchSpec();
  const normalized = normalize(spec);
  const liveHash = sha(normalized);

  if (mode === "freeze") {
    mkdirSync(dirname(SNAPSHOT), { recursive: true });
    writeFileSync(
      SNAPSHOT,
      JSON.stringify(
        {
          frozenAt: new Date().toISOString(),
          apiVersion: spec.info?.version,
          hash: liveHash,
          spec: normalized,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`❄️  [contract] 已冻结快照 → contracts/openapi.snapshot.json`);
    console.log(`   hash: ${liveHash}`);
    return;
  }

  if (!existsSync(SNAPSHOT)) {
    console.error(`❌ [contract] 未找到冻结快照: ${SNAPSHOT}`);
    console.error(`   首次请执行: node scripts/contract/check.mjs freeze`);
    process.exit(1);
  }

  const frozen = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  if (frozen.hash === liveHash) {
    console.log(`✅ [contract] 契约无漂移 (${liveHash.slice(0, 12)}…)`);
    return;
  }

  // 漂移详情（路径级 diff）
  console.error(`❌ [contract] 检测到契约漂移！`);
  console.error(`   冻结: ${frozen.hash.slice(0, 12)}… (${frozen.frozenAt})`);
  console.error(`   实况: ${liveHash.slice(0, 12)}…`);
  const fp = new Set(Object.keys(frozen.spec.paths));
  const lp = new Set(Object.keys(normalized.paths));
  const added = [...lp].filter((p) => !fp.has(p));
  const removed = [...fp].filter((p) => !lp.has(p));
  if (added.length) console.error(`   ➕ 新增端点: ${added.join(", ")}`);
  if (removed.length) console.error(`   ➖ 移除端点: ${removed.join(", ")}`);
  const fsc = new Set(frozen.spec.schemaNames);
  const lsc = new Set(normalized.schemaNames);
  const sAdd = [...lsc].filter((s) => !fsc.has(s));
  const sDel = [...fsc].filter((s) => !lsc.has(s));
  if (sAdd.length) console.error(`   📦 新增 Schema: ${sAdd.join(", ")}`);
  if (sDel.length) console.error(`   📦 移除 Schema: ${sDel.join(", ")}`);
  console.error(`   → 请人工复核后执行: node scripts/contract/check.mjs freeze`);
  process.exit(1);
}

main().catch((err) => {
  console.error(`❌ [contract] 检测失败: ${err.message}`);
  process.exit(1);
});
