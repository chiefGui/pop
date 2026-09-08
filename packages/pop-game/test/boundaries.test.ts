import { expect, test } from "vite-plus/test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) return sources(file);
    if (file.endsWith(".ts") && !file.endsWith(".test.ts")) return [file];
    return [];
  });
}
for (const name of ["pop-engine", "pop-game", "pop-content", "pop-game-client"]) {
  test(name + " capabilities use public entry points and have no dependency cycles", () => {
    const directory = resolve(root, "packages", name);
    const source = resolve(directory, "src");
    const manifest = JSON.parse(readFileSync(resolve(directory, "package.json"), "utf8")) as {
      imports: Record<string, string>;
    };
    const edges = new Map<string, Set<string>>();
    for (const file of sources(source)) {
      const path = relative(source, file).split(sep);
      if (path.length === 1) continue;
      const owner = path[0]!;
      const targets = edges.get(owner) ?? new Set<string>();
      edges.set(owner, targets);
      const imports = readFileSync(file, "utf8").matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g);
      for (const match of imports) {
        const specifier = match[1]!;
        let target: string | undefined;
        if (specifier.startsWith(".")) target = resolve(dirname(file), specifier);
        else if (specifier.startsWith("#")) {
          let mapped = manifest.imports[specifier];
          if (!mapped) {
            for (const [alias, value] of Object.entries(manifest.imports)) {
              if (!alias.endsWith("*")) continue;
              const prefix = alias.slice(0, -1);
              if (specifier.startsWith(prefix))
                mapped = value.replace("*", specifier.slice(prefix.length));
            }
          }
          expect(mapped, file + ": unknown alias " + specifier).toBeDefined();
          target = resolve(directory, mapped!);
        }
        if (!target) continue;
        const destination = relative(source, target).split(sep);
        expect(
          destination.length,
          file + ": a capability cannot import the package composition root",
        ).toBeGreaterThan(1);
        const dependency = destination[0]!;
        if (dependency === owner) continue;
        expect(
          destination.slice(1).join("/"),
          file + ": use the public entry point of " + dependency,
        ).toBe("index.ts");
        targets.add(dependency);
      }
    }
    const visited = new Set<string>();
    function visit(capability: string, ancestors: readonly string[]) {
      expect(
        ancestors,
        "Dependency cycle: " + [...ancestors, capability].join(" -> "),
      ).not.toContain(capability);
      if (visited.has(capability)) return;
      for (const dependency of edges.get(capability) ?? [])
        visit(dependency, [...ancestors, capability]);
      visited.add(capability);
    }
    for (const capability of edges.keys()) visit(capability, []);
  });
}
