import { expect, test } from "vite-plus/test";
import { ShapeUtils, Vector2 } from "three";
import districts, { outline, type Point } from "./geography.ts";

function area(points: readonly Point[]) {
  return ShapeUtils.area(points.map(([x, y]) => new Vector2(x, y)));
}
function key(a: Point, b: Point) {
  return `${a.join(",")}:${b.join(",")}`;
}
function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

test("15 original districts tile the city with exactly shared internal edges", () => {
  expect(districts).toHaveLength(15);
  expect(new Set(districts.map(({ id }) => id)).size).toBe(15);
  const edges = new Map<string, number>();
  const segments: [Point, Point][] = [];
  let totalArea = 0;
  for (const district of districts) {
    const { points } = district;
    expect(area(points)).toBeGreaterThan(0);
    totalArea += area(points);
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!;
      const b = points[(i + 1) % points.length]!;
      expect(a).not.toEqual(b);
      const id = key(a, b);
      edges.set(id, (edges.get(id) ?? 0) + 1);
      segments.push([a, b]);
    }
  }
  expect(totalArea).toBeCloseTo(area(outline), 6);
  const exterior = new Set(outline.map((a, i) => key(a, outline[(i + 1) % outline.length]!)));
  for (const [a, b] of segments) {
    expect(edges.get(key(a, b))).toBe(1);
    if (exterior.has(key(a, b))) {
      expect(edges.has(key(b, a))).toBe(false);
    } else {
      expect(edges.get(key(b, a))).toBe(1);
    }
  }
  for (let i = 0; i < segments.length; i++) {
    const [a, b] = segments[i]!;
    for (const [c, d] of segments.slice(i + 1)) {
      const crosses = cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
      expect(crosses, `Crossing boundaries ${key(a, b)} and ${key(c, d)}`).toBe(false);
    }
  }
});
