#!/usr/bin/env python3
"""YYC³ 多端资源全链路探针 — 验证开发服务器可达性"""
import urllib.request, urllib.error, concurrent.futures as cf, sys

paths = [
  "/",
  "/yyc3-icons/macOS/1024.png",
  "/yyc3-icons/macOS/256.png",
  "/yyc3-icons/macOS/128.png",
  "/yyc3-icons/iOS/iPhone%20App%203x.png",
  "/yyc3-icons/iOS/iPad%20App.png",
  "/yyc3-icons/iOS/App%20Store.png",
  "/yyc3-icons/Android/Play%20Store.png",
  "/yyc3-icons/Android/xxxhdpi.png",
  "/yyc3-icons/Web%20App/favicon-16.png",
  "/yyc3-icons/Web%20App/favicon-32.png",
  "/yyc3-icons/Web%20App/apple-touch-icon.png",
  "/yyc3-icons/Web%20App/android-chrome-192.png",
  "/yyc3-icons/Web%20App/android-chrome-512.png",
  "/yyc3-icons/watchOS/App%20Store.png",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.svg",
  "/browserconfig.xml",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/offline.html",
  "/banner.png",
  "/og-image.png",
  "/yyc3-Family.png",
  "/.well-known/security.txt",
  "/.well-known/apple-app-site-association",
  "/.well-known/assetlinks.json",
  "/src/main.tsx",
  "/src/App.tsx",
]

def probe(p):
    try:
        with urllib.request.urlopen("http://localhost:3032" + p, timeout=3) as r:
            return r.status, r.headers.get("Content-Length", "-"), r.headers.get("Content-Type", "-"), p
    except urllib.error.HTTPError as e:
        return e.code, "-", e.headers.get("Content-Type", "-") if e.headers else "-", p
    except Exception as e:
        return 0, "-", type(e).__name__, p

with cf.ThreadPoolExecutor(20) as ex:
    rs = list(ex.map(probe, paths))

ok = fail = 0
for code, sz, ct, p in rs:
    flag = "OK " if 200 <= code < 300 else "ERR"
    print(f"{flag} {code:3} {sz:>10}  {ct[:12]:12}  {p}")
    if 200 <= code < 300:
        ok += 1
    else:
        fail += 1

print()
print("=" * 60)
print(f"Probe: {ok}/{len(paths)} resources passed ({fail} failed)")
print("=" * 60)
sys.exit(0 if fail == 0 else 1)