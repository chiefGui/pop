export type Point = readonly [number, number];

const junctions: Record<string, Point> = {
  a0: [190, 115],
  a1: [325, 115],
  a2: [495, 130],
  a3: [660, 130],
  a4: [780, 150],
  b0: [170, 250],
  b1: [325, 250],
  b2: [465, 250],
  b3: [640, 250],
  b4: [800, 250],
  c0: [150, 375],
  c1: [310, 375],
  c2: [500, 375],
  c3: [660, 375],
  c4: [815, 375],
  d0: [180, 495],
  d1: [345, 495],
  d2: [465, 495],
  d3: [660, 495],
  d4: [775, 495],
  e0: [245, 615],
  e1: [345, 645],
  e2: [480, 650],
  e3: [640, 635],
  e4: [720, 600],
};

function junction(id: string): Point {
  const point = junctions[id];
  if (!point) throw new Error(`Unknown city junction: ${id}`);
  return point;
}

const boundaries = new Map<string, readonly Point[]>();
function boundary(from: string, to: string, bends: readonly Point[] = []) {
  boundaries.set(`${from}:${to}`, [junction(from), ...bends, junction(to)]);
}

boundary("a0", "a1");
boundary("a1", "a2", [
  [395, 115],
  [395, 130],
]);
boundary("a2", "a3");
boundary("a3", "a4", [
  [735, 130],
  [735, 150],
]);
boundary("b0", "b1");
boundary("b1", "b2", [
  [385, 250],
  [385, 235],
  [435, 235],
  [435, 250],
]);
boundary("b2", "b3");
boundary("b3", "b4");
boundary("c0", "c1");
boundary("c1", "c2", [
  [390, 375],
  [390, 355],
  [465, 355],
  [465, 375],
]);
boundary("c2", "c3");
boundary("c3", "c4", [
  [710, 375],
  [710, 360],
  [775, 360],
]);
boundary("d0", "d1");
boundary("d1", "d2");
boundary("d2", "d3");
boundary("d3", "d4");
boundary("e0", "e1", [
  [275, 625],
  [310, 630],
]);
boundary("e1", "e2", [
  [385, 645],
  [417, 631],
  [440, 633],
  [460, 646],
]);
boundary("e2", "e3", [
  [510, 644],
  [538, 623],
  [558, 617],
  [590, 625],
  [614, 635],
]);
boundary("e3", "e4", [
  [678, 625],
  [704, 613],
]);

boundary("a0", "b0");
boundary("b0", "c0", [
  [170, 320],
  [150, 320],
]);
boundary("c0", "d0", [
  [150, 450],
  [180, 450],
]);
boundary("d0", "e0", [
  [180, 550],
  [210, 550],
  [210, 595],
]);
boundary("a1", "b1");
boundary("b1", "c1", [
  [325, 310],
  [310, 310],
]);
boundary("c1", "d1", [
  [310, 430],
  [345, 430],
]);
boundary("a2", "b2", [
  [492, 153],
  [480, 180],
  [476, 202],
  [468, 225],
  [467, 235],
]);
boundary("b2", "c2", [
  [470, 272],
  [481, 294],
  [485, 319],
  [493, 338],
  [496, 355],
]);
boundary("c2", "d2", [
  [497, 398],
  [486, 421],
  [482, 445],
  [469, 470],
]);
boundary("d2", "e2", [
  [461, 521],
  [466, 548],
  [460, 576],
  [463, 604],
  [474, 627],
]);
boundary("a3", "b3", [
  [660, 200],
  [640, 200],
]);
boundary("b3", "c3", [
  [640, 315],
  [660, 315],
]);
boundary("c3", "d3", [[660, 475]]);
boundary("d3", "e3", [
  [660, 555],
  [640, 555],
]);
boundary("a4", "b4", [
  [780, 215],
  [800, 215],
]);
boundary("b4", "c4", [
  [800, 305],
  [815, 305],
]);
boundary("c4", "d4", [
  [809, 390],
  [800, 420],
  [782, 453],
  [775, 475],
]);
boundary("d4", "e4", [
  [770, 520],
  [755, 548],
  [748, 574],
]);

function ring(nodes: string[]): Point[] {
  const points: Point[] = [];
  for (let index = 0; index < nodes.length; index++) {
    const from = nodes[index]!;
    const to = nodes[(index + 1) % nodes.length]!;
    const forward = boundaries.get(`${from}:${to}`);
    if (forward) {
      points.push(...forward.slice(0, -1));
      continue;
    }
    const reverse = boundaries.get(`${to}:${from}`);
    if (!reverse) throw new Error(`Missing city boundary: ${from}:${to}`);
    points.push(...reverse.toReversed().slice(0, -1));
  }
  return points;
}

const definitions = [
  ["northwood", ["a0", "a1", "b1", "b0"]],
  ["the-heights", ["a1", "a2", "b2", "b1"]],
  ["ironwood", ["a2", "a3", "b3", "b2"]],
  ["eastgate", ["a3", "a4", "b4", "b3"]],
  ["westbank", ["b0", "b1", "c1", "c0"]],
  ["foundry", ["b1", "b2", "c2", "c1"]],
  ["old-town", ["b2", "b3", "c3", "c2"]],
  ["riverside", ["b3", "b4", "c4", "c3"]],
  ["the-common", ["c0", "c1", "d1", "d0"]],
  ["greywater", ["c1", "c2", "d2", "d1"]],
  ["millbrook", ["c2", "c3", "d3", "d2"]],
  ["eastmere", ["c3", "c4", "d4", "d3"]],
  ["southpoint", ["d0", "d1", "d2", "e2", "e1", "e0"]],
  ["lowlands", ["d2", "d3", "e3", "e2"]],
  ["southgate", ["d3", "d4", "e4", "e3"]],
] satisfies [string, string[]][];

export const outline = ring([
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "b4",
  "c4",
  "d4",
  "e4",
  "e3",
  "e2",
  "e1",
  "e0",
  "d0",
  "c0",
  "b0",
]);
export default definitions.map(([id, nodes]) => ({ id, points: ring(nodes) }));
