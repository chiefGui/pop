import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as stylex from "@stylexjs/stylex";

const stack = [
  ["Bun", "Workspace & package manager"],
  ["Electron", "Desktop shell"],
  ["Vite+", "Development, builds & checks"],
  ["React", "User interface"],
  ["TanStack Router", "Typed navigation"],
  ["TanStack Query", "Async state"],
  ["TanStack Virtual", "This scrollable list"],
  ["StyleX", "Compiled styles"],
  ["SQLite", "Local persistence"],
  ["Electron Forge", "Packaging"],
  ["Effect v4 RC", "Services, schemas & resource lifecycle"],
  ["TypeScript", "Static types"],
] as const;

const styles = stylex.create({
  title: { fontSize: 36, letterSpacing: "-1px" },
  description: { color: "#66706c", lineHeight: 1.7 },
  viewport: {
    height: 300,
    overflow: "auto",
    border: "1px solid #e4e7e2",
    borderRadius: 12,
    backgroundColor: "white",
  },
  list: (height: number) => ({ height, position: "relative", width: "100%" }),
  row: (offset: number) => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 64,
    transform: `translateY(${offset}px)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingInline: 20,
    borderBottom: "1px solid #eef0ec",
  }),
  purpose: { color: "#66706c", fontSize: 12, textAlign: "right" },
});

export function Stack() {
  const parent = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: stack.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 64,
    overscan: 2,
  });

  return (
    <section>
      <h1 {...stylex.props(styles.title)}>Ready to build.</h1>
      <p {...stylex.props(styles.description)}>Your stack, connected. Scroll to explore.</p>
      <div
        ref={parent}
        tabIndex={0}
        role="region"
        aria-label="Technology stack"
        {...stylex.props(styles.viewport)}
      >
        <div role="list" {...stylex.props(styles.list(virtualizer.getTotalSize()))}>
          {virtualizer.getVirtualItems().map((item) => {
            const entry = stack[item.index]!;
            return (
              <div
                key={item.key}
                role="listitem"
                aria-posinset={item.index + 1}
                aria-setsize={stack.length}
                {...stylex.props(styles.row(item.start))}
              >
                <strong>{entry[0]}</strong>
                <span {...stylex.props(styles.purpose)}>{entry[1]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
