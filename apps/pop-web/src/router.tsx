import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from "@tanstack/react-router";
import * as stylex from "@stylexjs/stylex";
import { Home } from "./routes/home";
import { Stack } from "./routes/stack";

const styles = stylex.create({
  shell: { maxWidth: 680, marginInline: "auto", padding: "48px 24px" },
  nav: { display: "flex", alignItems: "center", gap: 24, marginBottom: 64 },
  brand: { fontSize: 24, fontWeight: 800, letterSpacing: "-1px", marginRight: "auto" },
  link: {
    textDecoration: "none",
    fontSize: 14,
    color: { default: "#606666", ":hover": "#222526" },
  },
});

function Layout() {
  return (
    <main {...stylex.props(styles.shell)}>
      <nav aria-label="Main navigation" {...stylex.props(styles.nav)}>
        <span {...stylex.props(styles.brand)}>pop.</span>
        <Link to="/" {...stylex.props(styles.link)}>
          Home
        </Link>
        <Link to="/stack" {...stylex.props(styles.link)}>
          Stack
        </Link>
      </nav>
      <Outlet />
    </main>
  );
}

const rootRoute = createRootRoute({ component: Layout });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });
const stackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stack",
  component: Stack,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, stackRoute]),
  history: createHashHistory(),
  defaultNotFoundComponent: () => (
    <p>
      Page not found. <Link to="/">Go home</Link>
    </p>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
