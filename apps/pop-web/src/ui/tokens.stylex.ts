import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineVars({
  text: "#242d29",
  textMuted: "#68716a",
  textSubtle: "#7b8b77",
  surfaceCanvas: "#f5f5f2",
  surface: "#fafbf7",
  surfaceSubtle: "#edf0e7",
  border: "#dce0d6",
  borderControl: "#b9c2b7",
  action: "#2f5141",
  actionHover: "#244333",
  textOnAction: "#ffffff",
  surfaceHover: "#edf0e7",
  surfaceSelected: "#edf1e6",
  borderSelected: "#81977c",
  borderFocus: "#60856d",
  surfaceAccent: "#e8edde",
  textAccent: "#2f5141",
  surfacePositive: "#eaf0e3",
  textPositive: "#52644f",
  surfaceNegative: "#efe7dd",
  textNegative: "#79593d",
  progressTrack: "#e0e5da",
  progressFill: "#6c8663",
  textError: "#9a423a",
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
