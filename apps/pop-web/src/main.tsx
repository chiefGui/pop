import { StrictMode } from "react";
import * as stylex from "@stylexjs/stylex";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { colors, fonts } from "./ui/tokens.stylex";
import "./global.css";

const styles = stylex.create({
  document: {
    colorScheme: "dark",
    fontFamily: fonts.body,
    color: colors.text,
    backgroundColor: colors.surfaceCanvas,
    fontSynthesis: "none",
    textRendering: "optimizeLegibility",
    WebkitFontSmoothing: "antialiased",
    minWidth: 360,
  },
});

const documentClassName = stylex.props(styles.document).className;
if (documentClassName) document.documentElement.classList.add(...documentClassName.split(" "));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const root = document.getElementById("root");
if (!root) throw new Error("Missing app root");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
