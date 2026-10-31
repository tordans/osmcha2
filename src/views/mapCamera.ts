/** The zoom and centre a group's outline is computed at. */
export type MapCamera = { zoom: number; lng: number; lat: number }

/** MapLibre's world is 512 px wide at zoom 0. */
const WORLD_SIZE_AT_ZOOM_0 = 512
const MAX_MERCATOR_LAT = 85.051129

/** The zoom a group's outline is computed at. This form works at every other zoom too. */
const REFERENCE_ZOOM = 18.5
/**
 * A group may be this many pixels across at its reference zoom, which bounds the cost of its one
 * computation and the length of its outline: on the largest group measured, 873 buildings, about
 * 50 ms and 3k points at 1500, 80 ms and 10k at 2500, 110 ms and 20k at 4000. The next largest, 154
 * elements, still fits at `REFERENCE_ZOOM`.
 */
const MAX_GROUP_PIXELS = 2500

function mercatorX(lng: number) {
  return (lng + 180) / 360
}

function mercatorY(lat: number) {
  const clamped = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat))
  const sine = Math.sin((clamped * Math.PI) / 180)
  return 0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)
}

/** The coordinate of a position in the world square of `mercatorX` and `mercatorY`. */
function lngLatOfWorld(worldX: number, worldY: number): [lng: number, lat: number] {
  const n = Math.PI - 2 * Math.PI * worldY
  return [worldX * 360 - 180, (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))]
}

/** Pixels (from the camera's centre) of a coordinate at the camera's zoom, and back. */
export function cameraProjection(camera: MapCamera) {
  const size = WORLD_SIZE_AT_ZOOM_0 * 2 ** camera.zoom
  const originX = mercatorX(camera.lng)
  const originY = mercatorY(camera.lat)
  return {
    project: ([lng, lat]: readonly [number, number]) => ({
      x: (mercatorX(lng) - originX) * size,
      y: (mercatorY(lat) - originY) * size,
    }),
    unproject: ({ x, y }: { x: number; y: number }) =>
      lngLatOfWorld(originX + x / size, originY + y / size),
  }
}

/** `REFERENCE_ZOOM`, or the highest zoom at which a large group is `MAX_GROUP_PIXELS` across. */
export function referenceZoomOf(box: { west: number; south: number; east: number; north: number }) {
  const span = Math.max(
    mercatorX(box.east) - mercatorX(box.west),
    mercatorY(box.south) - mercatorY(box.north),
  )
  return Math.min(REFERENCE_ZOOM, Math.log2(MAX_GROUP_PIXELS / (span * WORLD_SIZE_AT_ZOOM_0)))
}
