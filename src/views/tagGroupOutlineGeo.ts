import type { TagGroup } from '../components/changeset/tagGroups.ts'
import { cameraProjection, referenceZoomOf } from './mapCamera.ts'
import {
  changesetFeatureIndex,
  memberBox,
  memberShapes,
  obstacleShapes,
  type GeoShape,
} from './tagGroupFeatures.ts'
import {
  computeTagGroupOutline,
  OUTLINE_TUNING,
  type OutlineStats,
  type Pixel,
  type PixelShape,
} from './tagGroupOutline.ts'

export type GroupOutlineOnMap = {
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
  labelAt: [lng: number, lat: number]
  zoom: number
  stats: OutlineStats
}

function toPixels(shape: GeoShape, project: (at: readonly [number, number]) => Pixel): PixelShape {
  return shape.kind === 'point'
    ? { kind: 'point', at: project(shape.at) }
    : { kind: 'line', points: shape.points.map((at) => project(at)) }
}

/**
 * The outline of one group on the map: members and nearby other elements are projected to pixels at
 * the group's reference zoom, centred on the group, and the band is computed there and projected
 * back. It depends on the group alone, not on the view or the selected element.
 */
export function groupOutlineOnMap(input: {
  geojson: Parameters<typeof changesetFeatureIndex>[0]
  memberKeys: readonly string[]
}): GroupOutlineOnMap | null {
  const started = performance.now()
  const index = changesetFeatureIndex(input.geojson)
  const box = memberBox(index, input.memberKeys)
  if (!box) return null
  const zoom = referenceZoomOf(box)
  const { project, unproject } = cameraProjection({
    zoom,
    lng: (box.west + box.east) / 2,
    lat: (box.south + box.north) / 2,
  })

  // Only elements near the members can touch the band: ask for those in a box around them.
  const reach = OUTLINE_TUNING.obstacleReach
  const topLeft = project([box.west, box.north])
  const bottomRight = project([box.east, box.south])
  const [west, north] = unproject({ x: topLeft.x - reach, y: topLeft.y - reach })
  const [east, south] = unproject({ x: bottomRight.x + reach, y: bottomRight.y + reach })
  const obstacles = obstacleShapes(
    index,
    { west, south, east, north },
    { exclude: new Set(input.memberKeys) },
  )

  const outline = computeTagGroupOutline({
    members: memberShapes(index, input.memberKeys).map((item) => toPixels(item.shape, project)),
    obstacles: obstacles.map((item) => toPixels(item.shape, project)),
  })
  // Shows in the browser's performance timeline as "tag-group-outline", with what it worked on.
  performance.measure('tag-group-outline', { start: started, detail: outline?.stats })
  if (!outline) return null
  const ring = outline.ring.map((at) => unproject(at))
  return {
    polygon: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]!]] },
    },
    labelAt: unproject(outline.labelAt),
    zoom,
    stats: outline.stats,
  }
}

const IDLE_TIMEOUT_MS = 200

/** After the click has painted. Safari has no `requestIdleCallback`. */
function whenIdle() {
  return new Promise<unknown>((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(resolve, { timeout: IDLE_TIMEOUT_MS })
    } else {
      setTimeout(resolve, IDLE_TIMEOUT_MS / 4)
    }
  })
}

const outlines = new WeakMap<object, Map<string, Promise<GroupOutlineOnMap | null>>>()

/**
 * The one outline of a group, computed once per changeset and group, off the click path. The adiff's
 * `actions` stay the same when map layers rebuild the viewer, so the shape does too.
 */
export function groupOutlineOnce(
  viewer: { adiff: { actions: object }; geojson: Parameters<typeof changesetFeatureIndex>[0] },
  group: TagGroup,
) {
  let byCode = outlines.get(viewer.adiff.actions)
  if (!byCode) {
    byCode = new Map()
    outlines.set(viewer.adiff.actions, byCode)
  }
  let outline = byCode.get(group.code)
  if (!outline) {
    outline = whenIdle()
      .then(() => groupOutlineOnMap({ geojson: viewer.geojson, memberKeys: group.memberKeys }))
      // The band is a help for the eye: without it the group is still in the list.
      .catch((error: unknown) => {
        console.error('Could not compute the outline of group', group.code, error)
        return null
      })
    byCode.set(group.code, outline)
  }
  return outline
}
