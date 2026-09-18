#!/usr/bin/env bash
# YYC³ Icon 五端可视化体系 · 一键自检
# YYC³ Icon Visualization System · One-shot Self-Check
# Usage: bash scripts/check-icons.sh
set -e

ROOT="public/yyc3-icons"
PASS=0
FAIL=0

ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo "🎨 ====== 1) 平台目录完整性 ======"
for dir in Android "Web App" iOS macOS watchOS; do
  count=$(ls "$ROOT/$dir" 2>/dev/null | wc -l | tr -d ' ')
  if [ -n "$count" ] && [ "$count" -gt 0 ]; then
    ok "$dir : $count files"
  else
    fail "$dir : missing or empty"
  fi
done

echo ""
echo "🎯 ====== 2) 关键尺寸命中 ======"
declare -a MUST=(
  "Web App/favicon-16.png"
  "Web App/favicon-32.png"
  "Web App/apple-touch-icon.png"
  "Web App/android-chrome-192.png"
  "Web App/android-chrome-512.png"
  "macOS/1024.png"
  "macOS/256.png"
  "Android/xxxhdpi.png"
  "iOS/iPhone App 3x.png"
  "iOS/App Store.png"
)
for f in "${MUST[@]}"; do
  if [ -f "$ROOT/$f" ]; then ok "$f"; else fail "$f MISSING"; fi
done

echo ""
echo "🌐 ====== 3) 关键元文件 ======"
for f in favicon.ico favicon.svg browserconfig.xml robots.txt sitemap.xml manifest.webmanifest sw.js offline.html banner.png og-image.png; do
  if [ -f "public/$f" ]; then ok "public/$f"; else fail "public/$f MISSING"; fi
done

echo ""
echo "🔐 ====== 4) .well-known ======"
for f in security.txt apple-app-site-association assetlinks.json; do
  if [ -f "public/.well-known/$f" ]; then ok ".well-known/$f"; else fail ".well-known/$f MISSING"; fi
done

echo ""
echo "🚀 ====== 5) 尺寸校验（关键几张）======"
for f in "Web App/favicon-16.png" "Web App/apple-touch-icon.png" "Android/xxxhdpi.png" "macOS/1024.png"; do
  if [ -f "$ROOT/$f" ]; then
    size=$(sips -g pixelWidth "$ROOT/$f" 2>/dev/null | tail -1 | awk '{print $2}')
    echo "  📐 $f : ${size}px"
  fi
done

echo ""
echo "📊 ====== 总计 ======"
echo "  ✅ Pass : $PASS"
echo "  ❌ Fail : $FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "🎉 All checks passed!"
