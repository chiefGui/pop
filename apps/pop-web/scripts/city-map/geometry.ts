import * as THREE from "three";
import ClipperLib from "clipper-lib";
import type { Point } from "./geography.ts";

export const relief = { depth: 0.2, bevel: 0.012, faceLift: 0.001 };

export function insetPolygon(points: readonly Point[], distance: number): Point[] {
  const scale = 1000;
  const path = points.map(([x, y]) => ({ X: Math.round(x * scale), Y: Math.round(y * scale) }));
  const offset = new ClipperLib.ClipperOffset(2, 0.1 * scale);
  offset.AddPath(path, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
  const solution = [] as ClipperLib.Paths;
  offset.Execute(solution, -distance * scale);
  if (solution.length !== 1 || solution[0]!.length < 3) {
    throw new Error("A region could not be inset as one connected polygon.");
  }
  return solution[0]!.map((point) => [point.X / scale, point.Y / scale]);
}

export function makeShape(points: readonly Point[]) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    const mapX = (x - 490) / 100;
    const mapY = (380 - y) / 100;
    if (index === 0) shape.moveTo(mapX, mapY);
    else shape.lineTo(mapX, mapY);
  });
  shape.closePath();
  return shape;
}

export function createRegionGeometry(points: readonly Point[]) {
  const bodyPoints = insetPolygon(points, 1.4);
  const facePoints = insetPolygon(points, 3);
  const body = new THREE.ExtrudeGeometry(makeShape(bodyPoints), {
    depth: relief.depth,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: relief.bevel,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 1,
  });
  body.rotateX(-Math.PI / 2);
  const face = new THREE.ShapeGeometry(makeShape(facePoints));
  face.rotateX(-Math.PI / 2);
  face.translate(0, relief.depth + relief.bevel + relief.faceLift, 0);
  // A common map coordinate system makes the grain continuous across the sheet.
  for (const geometry of [body, face]) {
    const positions = geometry.attributes.position!;
    const uv = geometry.attributes.uv!;
    for (let i = 0; i < positions.count; i++)
      uv.setXY(i, (positions.getX(i) + 5) / 10, (positions.getZ(i) + 4) / 8);
    uv.needsUpdate = true;
  }
  return { body, face, bodyPoints, facePoints };
}
