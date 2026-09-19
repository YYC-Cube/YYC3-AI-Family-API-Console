import { NavLink, Outlet, RouterProvider, createBrowserRouter } from "react-router";
import logoCyan from "./imports/512.png";
import { family, pages, Status } from "./domains/shared";
import { Home, Overview, Mcp, Governance } from "./domains/tianshu";
import { Models } from "./domains/bole";
import { Playground } from "./domains/wanyu";
import { Routing } from "./domains/qianxing";
import { Knowledge } from "./domains/zongshi-knowledge";
import { Cache } from "./domains/lingyun-cache";
import { Monitor } from "./domains/xianzhi-monitor";
import { Security } from "./domains/zhihui";
import { Branding } from "./domains/lingyun-branding";

function Shell() {
  return (
    <main className="app-shell">
      <aside className="side">
        <div className="brand">
          <img src={logoCyan} alt="YanYu Cloud³ cyan logo" />
          <span className="mono">CONSOLE</span>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            <span>◈</span>首页大盘
          </NavLink>
          {pages.map((p) => (
            <NavLink
              key={p.path}
              to={p.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span>{family[p.family].emoji}</span>
              {p.nav}
            </NavLink>
          ))}
        </nav>
        <div className="side-footer">
          <Status tone="muted">awaiting /healthz</Status>
          <span className="mono">v2.2.0 / v5.1</span>
        </div>
      </aside>
      <section className="shell-main">
        <header className="topbar">
          <div className="mono">
            YYC³ / {location.pathname.replace("/", "").toUpperCase() || "HOME"}
          </div>
          <div>
            <button className="icon-button">⌘ K</button>
            <button className="avatar">Y³</button>
          </div>
        </header>
        <Outlet />
      </section>
    </main>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: Shell,
    children: [
      { index: true, Component: Home },
      { path: "dashboard", Component: () => <Overview page={pages[0]} /> },
      { path: "models", Component: () => <Models page={pages[1]} /> },
      { path: "playground", Component: () => <Playground page={pages[2]} /> },
      { path: "routing", Component: () => <Routing page={pages[3]} /> },
      { path: "knowledge", Component: () => <Knowledge page={pages[4]} /> },
      { path: "mcp", Component: () => <Mcp page={pages[5]} /> },
      { path: "cache", Component: () => <Cache page={pages[6]} /> },
      { path: "monitor", Component: () => <Monitor page={pages[7]} /> },
      { path: "security", Component: () => <Security page={pages[8]} /> },
      { path: "branding", Component: () => <Branding page={pages[9]} /> },
      { path: "governance", Component: () => <Governance page={pages[10]} /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
