import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { Home } from "./routes/home";

function Layout() {
  return <Outlet />;
}

const rootRoute = createRootRoute({ component: Layout });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute]),
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
