import { describe, expect, test } from 'vitest'
import {
  computeTagGroupOutline,
  labelPoint,
  type Pixel,
  type PixelShape,
  type TagGroupOutline,
} from './tagGroupOutline.ts'

function point(x: number, y: number): PixelShape {
  return { kind: 'point', at: { x, y } }
}

function line(...coordinates: Array<[number, number]>): PixelShape {
  return { kind: 'line', points: coordinates.map(([x, y]) => ({ x, y })) }
}

function inside(ring: readonly Pixel[], at: Pixel) {
  let result = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const a = ring[index]!
    const b = ring[previous]!
    if (a.y > at.y !== b.y > at.y && at.x < ((b.x - a.x) * (at.y - a.y)) / (b.y - a.y) + a.x) {
      result = !result
    }
  }
  return result
}

function outlineOf(input: Parameters<typeof computeTagGroupOutline>[0]): TagGroupOutline {
  const outline = computeTagGroupOutline(input)
  if (!outline) throw new Error('expected an outline')
  return outline
}

describe('computeTagGroupOutline', () => {
  test('nothing to wrap, nothing to draw', () => {
    expect(computeTagGroupOutline({ members: [], obstacles: [] })).toBeNull()
  })

  test('wraps members that lie apart and thins to a neck between them', () => {
    const { ring } = outlineOf({
      members: [point(200, 300), point(520, 300)],
      obstacles: [],
    })

    expect(inside(ring, { x: 200, y: 300 })).toBe(true)
    expect(inside(ring, { x: 520, y: 300 })).toBe(true)
    // The neck links them ...
    expect(inside(ring, { x: 360, y: 300 })).toBe(true)
    // ... and is thin: much narrower than the gap, nowhere near a box around both.
    expect(inside(ring, { x: 360, y: 300 - 30 })).toBe(false)
    expect(inside(ring, { x: 360, y: 300 + 30 })).toBe(false)
    expect(inside(ring, { x: 200, y: 300 - 60 })).toBe(false)
  })

  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

  test('keeps a gap of 7 to 10 px to the drawn edge of a node', () => {
    const center = { x: 400, y: 300 }
    const { ring } = outlineOf({ members: [point(center.x, center.y)], obstacles: [] })
    const gaps = ring.map((at) => Math.hypot(at.x - center.x, at.y - center.y) - 9)

    expect(mean(gaps)).toBeGreaterThanOrEqual(7)
    expect(mean(gaps)).toBeLessThanOrEqual(10)
    // Never on the symbol itself.
    expect(Math.min(...gaps)).toBeGreaterThan(2)
  })

  test('keeps a gap of 7 to 10 px to the drawn edge of a line', () => {
    const { ring } = outlineOf({ members: [line([200, 300], [500, 300])], obstacles: [] })
    // Along the middle of the line, away from its rounded ends.
    const gaps = ring.filter((at) => at.x > 260 && at.x < 440).map((at) => Math.abs(at.y - 300) - 4)

    expect(mean(gaps)).toBeGreaterThanOrEqual(7)
    expect(mean(gaps)).toBeLessThanOrEqual(10)
    expect(Math.min(...gaps)).toBeGreaterThan(2)
  })

  test('holds every corner of a bent member line', () => {
    const corners: Array<[number, number]> = [
      [100, 100],
      [400, 100],
      [400, 300],
      [250, 300],
    ]
    const { ring } = outlineOf({ members: [line(...corners)], obstacles: [] })

    for (const [x, y] of corners) expect(inside(ring, { x, y })).toBe(true)
    expect(inside(ring, { x: 250, y: 100 })).toBe(true)
    expect(inside(ring, { x: 400, y: 200 })).toBe(true)
  })

  test('squeezes around other elements instead of swallowing them', () => {
    // A road runs parallel to the neck, a few pixels beside it.
    const road = line([300, 330], [420, 330])
    const { ring } = outlineOf({
      members: [point(200, 300), point(520, 300)],
      obstacles: [road],
    })

    expect(inside(ring, { x: 200, y: 300 })).toBe(true)
    expect(inside(ring, { x: 520, y: 300 })).toBe(true)
    for (const x of [320, 360, 400]) expect(inside(ring, { x, y: 330 })).toBe(false)
  })

  test('a member that touches another element is still held', () => {
    const { ring } = outlineOf({
      members: [line([300, 300], [380, 300])],
      obstacles: [line([300, 300], [300, 380]), line([300, 310], [380, 310])],
    })

    for (const x of [300, 340, 380]) expect(inside(ring, { x, y: 300 })).toBe(true)
  })

  test('holds members however far apart they are', () => {
    const { ring } = outlineOf({ members: [point(-3000, 300), point(4000, 300)], obstacles: [] })

    expect(inside(ring, { x: -3000, y: 300 })).toBe(true)
    expect(inside(ring, { x: 4000, y: 300 })).toBe(true)
  })

  test('every member of a group past the routing budget is held', () => {
    const buildings = Array.from({ length: 800 }, (_, index) => {
      const x = 100 + (index % 40) * 60
      const y = 100 + Math.floor(index / 40) * 60
      return line([x, y], [x + 12, y], [x + 12, y + 12], [x, y + 12], [x, y])
    })
    const obstacles = Array.from({ length: 100 }, (_, index) => point(130 + index * 20, 130))
    const outline = outlineOf({ members: buildings, obstacles })

    for (const building of buildings) {
      if (building.kind !== 'line') throw new Error('expected a line')
      for (const at of building.points) expect(inside(outline.ring, at)).toBe(true)
    }
  })
})

describe('labelPoint', () => {
  test('uses the centre of mass of a compact shape', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    expect(labelPoint(square)).toEqual({ x: 5, y: 5 })
  })

  test('stays inside a bent shape whose centre of mass lies outside', () => {
    const bent = [
      { x: 0, y: 3 },
      { x: 100, y: 0 },
      { x: 101, y: 10 },
      { x: 12, y: 11 },
      { x: 10, y: 100 },
      { x: 0, y: 100 },
    ]
    const { x, y } = labelPoint(bent)
    expect(x).toBeCloseTo(8.74, 1)
    expect(y).toBeCloseTo(6.92, 1)
  })
})
