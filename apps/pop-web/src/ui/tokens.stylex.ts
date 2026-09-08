import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineVars({
  text: "#eee8df",
  textMuted: "#b8b0aa",
  textSubtle: "#a49a96",
  surfaceCanvas: "#141416",
  surface: "#1b1b1f",
  surfaceSubtle: "#242327",
  border: "#393439",
  borderControl: "#716369",
  surfaceAction: "#6e2938",
  surfaceActionHover: "#843747",
  textOnAction: "#eee8df",
  surfaceHover: "#2b2a2e",
  surfaceSelected: "#35242b",
  borderSelected: "#b36d7b",
  borderFocus: "#d59aa4",
  surfaceAccent: "#352029",
  textAccent: "#d59aa4",
  surfacePositive: "#252e28",
  textPositive: "#b1c5ae",
  surfaceNegative: "#3b2329",
  textNegative: "#e2a3ad",
  progressTrack: "#393039",
  progressFill: "#b36d7b",
  textError: "#efa5ad",
});

export const fonts = stylex.defineVars({
  body: "Inter, ui-sans-serif, system-ui, sans-serif",
  display: "Georgia, serif",
});

export const fontSizes = stylex.defineVars({
  xs: "10px",
  sm: "11px",
  md: "12px",
  lg: "13px",
  xl: "14px",
  xxl: "16px",
});

export const fontWeights = stylex.defineVars({
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
});

export const radii = stylex.defineVars({
  xs: "3px",
  sm: "5px",
  md: "6px",
  lg: "8px",
});

export const controls = stylex.defineVars({
  minHeight: "44px",
  disabledOpacity: 0.43,
  focusWidth: "2px",
  focusOffset: "3px",
});

export const breakpoints = stylex.defineConsts({
  upToCompact: "@media (max-width: 680px)",
  upToMedium: "@media (max-width: 900px)",
  fromWide: "@media (min-width: 1600px)",
});

export const layout = stylex.defineVars({
  featureRailWidth: "88px",
  featurePanelWidth: "520px",
});
