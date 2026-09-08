import { expect, test } from "vite-plus/test";
import { Box3, Vector3 } from "three";
import { createMapCamera, fitMapCamera } from "./map-camera";

test.each([
  [1600, 900],
  [900, 1600],
  [320, 480],
  [2400, 700],
])(
  "fits an off-center city at %i by %i without clipping or changing the view angle",
  (width, height) => {
    const camera = createMapCamera();
    const position = camera.position.clone();
    const rotation = camera.quaternion.clone();
    const bounds = new Box3(new Vector3(-2, -0.012, -3), new Vector3(4, 0.213, 2.5));
    fitMapCamera(camera, bounds, width, height);
    expect(camera.position.equals(position)).toBe(true);
    expect(camera.quaternion.equals(rotation)).toBe(true);
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new Vector3(x, y, z).project(camera);
          expect(Math.abs(point.x)).toBeLessThan(1);
          expect(Math.abs(point.y)).toBeLessThan(1);
          expect(Math.abs(point.z)).toBeLessThan(1);
        }
      }
    }
  },
);

test("a hidden viewport does not corrupt the camera projection", () => {
  const camera = createMapCamera();
  const projection = camera.projectionMatrix.clone();
  fitMapCamera(camera, new Box3(), 0, 0);
  expect(camera.projectionMatrix.equals(projection)).toBe(true);
});
