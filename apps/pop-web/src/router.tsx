import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { Home } from "./routes/home";
import { Stack } from "./routes/stack";

function Layout() {
  return <Outlet />;
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
