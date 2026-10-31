import { z } from 'zod'
import type { ChangesetFeatureIndex, GeoShape, LngLatBox } from './tagGroupFeatures.ts'

/** How far around a change its surroundings reach. */
const CHANGE_BUFFER_METERS = 60
/** The most one request may cover. A box only grows this big when the changes need it. */
const MAX_BOX_KM2 = 0.25
/** A line is followed in steps of this size, so that no stretch of it is left out. */
const LINE_STEP_METERS = 50
/** Rounded outward to this many decimals, about 11 m: shorter URLs that match more often. */
const BOX_DECIMALS = 4
const METERS_PER_DEGREE_LAT = 111_320
/** Requests of one click; a further click loads the next ones. */
export const MAX_BOXES_PER_CLICK = 6

export type ChangePoint = readonly [lng: number, lat: number]

export type MapView = { box: LngLatBox; center: ChangePoint; at: number }

function metersPerDegreeLng(lat: number) {
  return METERS_PER_DEGREE_LAT * Math.max(Math.cos((lat * Math.PI) / 180), 0.01)
}

export function boxKey({ west, south, east, north }: LngLatBox) {
  return `${west},${south},${east},${north}`
}

export function boxAreaKm2({ west, south, east, north }: LngLatBox) {
  const widthMeters = (east - west) * metersPerDegreeLng((south + north) / 2)
  return (widthMeters * (north - south) * METERS_PER_DEGREE_LAT) / 1_000_000
}

function roundedOutward({ west, south, east, north }: LngLatBox): LngLatBox {
  const factor = 10 ** BOX_DECIMALS
  return {
    west: Math.floor(west * factor) / factor,
    south: Math.floor(south * factor) / factor,
    east: Math.ceil(east * factor) / factor,
    north: Math.ceil(north * factor) / factor,
  }
}

function bufferedBox([lng, lat]: ChangePoint): LngLatBox {
  const latBuffer = CHANGE_BUFFER_METERS / METERS_PER_DEGREE_LAT
  const lngBuffer = CHANGE_BUFFER_METERS / metersPerDegreeLng(lat)
  return {
    west: lng - lngBuffer,
    south: lat - latBuffer,
    east: lng + lngBuffer,
    north: lat + latBuffer,
  }
}

function unionOf(a: LngLatBox, b: LngLatBox): LngLatBox {
  return {
    west: Math.min(a.west, b.west),
    south: Math.min(a.south, b.south),
    east: Math.max(a.east, b.east),
    north: Math.max(a.north, b.north),
  }
}

function contains(outer: LngLatBox, inner: LngLatBox) {
  return (
    outer.west <= inner.west &&
    outer.south <= inner.south &&
    outer.east >= inner.east &&
    outer.north >= inner.north
  )
}

function boxesMeet(a: LngLatBox, b: LngLatBox) {
  return a.east >= b.west && a.west <= b.east && a.north >= b.south && a.south <= b.north
}

function pointsAlong(shape: GeoShape): ChangePoint[] {
  if (shape.kind === 'point') return [shape.at]
  return shape.points.flatMap((point, index) => {
    const next = shape.points[index + 1]
    if (!next) return [point]
    const meters = Math.hypot(
      (next[0] - point[0]) * metersPerDegreeLng(point[1]),
      (next[1] - point[1]) * METERS_PER_DEGREE_LAT,
    )
    const steps = Math.max(1, Math.ceil(meters / LINE_STEP_METERS))
    return Array.from({ length: steps }, (_, step): ChangePoint => [
      point[0] + ((next[0] - point[0]) * step) / steps,
      point[1] + ((next[1] - point[1]) * step) / steps,
    ])
  })
}

/** The points that stand for each of the given elements (`node/123`). */
export function pointsByElement(index: ChangesetFeatureIndex, elementKeys: readonly string[]) {
  return new Map(
    elementKeys.map((key) => [
      key,
      (index.byKey.get(key) ?? []).flatMap(({ shape }) => pointsAlong(shape)),
    ]),
  )
}

function distance([lng, lat]: ChangePoint, [otherLng, otherLat]: ChangePoint) {
  return Math.hypot(
    (otherLng - lng) * metersPerDegreeLng(lat),
    (otherLat - lat) * METERS_PER_DEGREE_LAT,
  )
}

/**
 * The points of changes in view whose surroundings are not loaded yet, the focused elements' first,
 * then the ones nearest to the centre of the view.
 */
export function missingPoints({
  byElement,
  focusKeys,
  view,
  loaded,
}: {
  byElement: ReadonlyMap<string, readonly ChangePoint[]>
  focusKeys: readonly string[]
  view: MapView
  loaded: readonly LngLatBox[]
}) {
  const isMissing = (point: ChangePoint) => {
    const [lng, lat] = point
    const inView =
      lng >= view.box.west && lng <= view.box.east && lat >= view.box.south && lat <= view.box.north
    return inView && !loaded.some((box) => contains(box, bufferedBox(point)))
  }
  const byCentre = (points: readonly ChangePoint[]) =>
    points
      .filter(isMissing)
      .toSorted((left, right) => distance(left, view.center) - distance(right, view.center))
  const focus = byCentre(focusKeys.flatMap((key) => byElement.get(key) ?? []))
  return [...focus, ...byCentre([...byElement.values()].flat())]
}

/**
 * Boxes for the given points, in their order: each starts at the first point left and takes in the
 * nearest ones for as long as it stays within the limit. So a box is as small as its changes allow.
 */
export function boxesFor(points: readonly ChangePoint[], maxBoxes: number) {
  const boxes: LngLatBox[] = []
  let left = points
  while (left.length > 0 && boxes.length < maxBoxes) {
    const [seed] = left
    let box = roundedOutward(bufferedBox(seed!))
    for (const point of left.toSorted((a, b) => distance(seed!, a) - distance(seed!, b))) {
      const grown = roundedOutward(unionOf(box, bufferedBox(point)))
      if (boxAreaKm2(grown) <= MAX_BOX_KM2) box = grown
    }
    const covered = box
    boxes.push(covered)
    left = left.filter((point) => !contains(covered, bufferedBox(point)))
  }
  return boxes
}

/** The frame of each loaded box. */
export function boxOutlines(boxes: readonly LngLatBox[]): GeoJSON.Position[][] {
  return boxes.map(({ west, south, east, north }) => [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
    [west, north],
  ])
}

/** The middle of each box's top edge: where its label sits. */
export function boxLabelPoints(boxes: readonly LngLatBox[]): GeoJSON.Position[] {
  return boxes.map(({ west, east, north }) => [(west + east) / 2, north])
}

/** The oldest data in view: what the label on the frame names. Null when no box is in view. */
export function oldestTimestampInView(
  boxes: ReadonlyArray<LngLatBox & { timestamp: string }>,
  view: MapView,
) {
  return (
    boxes
      .filter((box) => boxesMeet(box, view.box))
      .map((box) => box.timestamp)
      .toSorted()[0] ?? null
  )
}

/**
 * Whether an object counts as an area, by the rule of our presets (iD's and MAID's): Postpass's
 * polygon decides for relations, and for ways until the preset data is there.
 */
export function isSurroundingsArea(
  { osmType, polygon, closed, tags }: GeoJSON.GeoJsonProperties & {},
  isArea: ((tags: Record<string, string>, closed: boolean) => boolean) | undefined,
) {
  if (osmType !== 'way' || !isArea) return polygon === true
  return isArea(Object.fromEntries(parseSurroundingsTags(tags)), closed === true)
}

const tagsSchema = z.record(z.string(), z.string())

/** MapLibre hands feature properties back as written: the tags are the JSON string we stored. */
export function parseSurroundingsTags(value: unknown): Array<[string, string]> {
  if (typeof value !== 'string') return []
  try {
    return Object.entries(tagsSchema.parse(JSON.parse(value)))
  } catch {
    return []
  }
}
