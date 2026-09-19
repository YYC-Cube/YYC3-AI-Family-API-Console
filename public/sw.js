/*
 * YYC³ AI Family Token Console — Service Worker
 * 五维驱动：时间维（版本化清理）+ 空间维（按资源类型分桶）+ 属性维（缓存策略分级）
 *          + 事件维（install/activate/fetch/message 四态机）+ 关联维（同名依赖一致哈希）
 */
const VERSION = "yyc3-console-v1.0.0";
const CACHE_NAME = `yyc3-console-${VERSION.split("-").pop()}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;
const OFFLINE_URL = "/offline.html";

// ===== 预缓存（核心壳 + 多端图标）=====
const PRECACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.svg",
  "/browserconfig.xml",
  "/robots.txt",
  "/sitemap.xml",
  "/og-image.png",
  "/banner.png",
  "/yyc3-Family.png",
  // 多端 favicon 全尺寸（保证全部首选命中）
  "/yyc3-icons/Web App/favicon-16.png",
  "/yyc3-icons/Web App/favicon-32.png",
  "/yyc3-icons/Web App/apple-touch-icon.png",
  "/yyc3-icons/Web App/android-chrome-192.png",
  "/yyc3-icons/Web App/android-chrome-512.png",
  // macOS
  "/yyc3-icons/macOS/16.png",
  "/yyc3-icons/macOS/32.png",
  "/yyc3-icons/macOS/64.png",
  "/yyc3-icons/macOS/128.png",
  "/yyc3-icons/macOS/256.png",
  "/yyc3-icons/macOS/512.png",
  "/yyc3-icons/macOS/1024.png",
  // Android
  "/yyc3-icons/Android/mdpi.png",
  "/yyc3-icons/Android/hdpi.png",
  "/yyc3-icons/Android/xhdpi.png",
  "/yyc3-icons/Android/xxhdpi.png",
  "/yyc3-icons/Android/xxxhdpi.png",
];

// ===== 安装：原子写入预缓存 =====
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // 单一失败不阻塞整体
      await Promise.all(
        PRECACHE.map((url) =>
          cache
            .add(new Request(url, { cache: "no-cache" }))
            .catch((err) => console.warn("[SW] precache skipped:", url, err?.message)),
        ),
      );
      return self.skipWaiting();
    }),
  );
});

// ===== 激活：清理历史版本 =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE && k.startsWith("yyc3-console"))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// ===== 路由策略 =====
const isImage = (url) => /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)(\?|$)/.test(url.pathname);
const isFont = (url) => /\.(woff2?|ttf|otf|eot)(\?|$)/.test(url.pathname);
const isStatic = (url) =>
  isImage(url) ||
  isFont(url) ||
  /\.(css|js)(\?|$)/.test(url.pathname) ||
  url.pathname.startsWith("/yyc3-icons/");
const isNavigation = (req) =>
  req.mode === "navigate" ||
  (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 导航：Network First → 缓存 → 离线
  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(RUNTIME_CACHE)
            .then((c) => c.put(request, copy))
            .catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL) || caches.match("/");
        }),
    );
    return;
  }

  // 静态资源：Cache First（命中率高，节省带宽）
  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              if (res.ok) {
                const copy = res.clone();
                caches
                  .open(RUNTIME_CACHE)
                  .then((c) => c.put(request, copy))
                  .catch(() => {});
              }
              return res;
            })
            .catch(() => cached),
      ),
    );
    return;
  }

  // 其余：Network First
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches
            .open(RUNTIME_CACHE)
            .then((c) => c.put(request, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request)),
  );
});

// ===== 消息协议：SKIP_WAITING / CLEAR_RUNTIME =====
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_RUNTIME")
    caches.delete(RUNTIME_CACHE).then(() => event.ports[0]?.postMessage({ cleared: true }));
});
