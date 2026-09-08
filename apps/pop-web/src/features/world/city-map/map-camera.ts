import { Box3, OrthographicCamera, Vector3 } from "three";

export function createMapCamera() {
  const camera = new OrthographicCamera(-5, 5, 4, -4, 0.1, 100);
  camera.position.set(3.1, 9.5, 6.1);
  camera.lookAt(0, 0.1, 0);
  return camera;
}

export function fitMapCamera(
  camera: OrthographicCamera,
  bounds: Box3,
  width: number,
  height: number,
) {
  if (width <= 0 || height <= 0 || bounds.isEmpty()) return;
  camera.updateMatrixWorld();
  const projected = new Box3();
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        projected.expandByPoint(new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
      }
    }
  }
  const aspect = width / height;
  const span =
    Math.max(projected.max.y - projected.min.y, (projected.max.x - projected.min.x) / aspect) *
    1.23;
  const center = projected.getCenter(new Vector3());
  camera.left = center.x - (span * aspect) / 2;
  camera.right = center.x + (span * aspect) / 2;
  camera.top = center.y + span / 2;
  camera.bottom = center.y - span / 2;
  camera.updateProjectionMatrix();
}
