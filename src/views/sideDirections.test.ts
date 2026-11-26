import { describe, expect, test } from 'vitest'
import { SIDE_OFFSET_PX, sideDirectionsOf, sideLineFeatures } from './sideDirections.ts'

describe('sideDirectionsOf', () => {
  test('reads both sides, the side tag winning over both', () => {
    expect(
      sideDirectionsOf({
        'cycleway:both:oneway': 'yes',
        'cycleway:left:oneway': '-1',
        'sidewalk:right:oneway': 'no',
      }),
    ).toEqual([
      { kind: 'cycleway', side: 'left', direction: -1 },
      { kind: 'cycleway', side: 'right', direction: 1 },
      { kind: 'sidewalk', side: 'right', direction: 0 },
    ])
  })

  test('ignores ways without side oneway tags', () => {
    expect(sideDirectionsOf({ oneway: 'yes', cycleway: 'lane' })).toEqual([])
  })
})

describe('sideLineFeatures', () => {
  const line: Array<[number, number]> = [
    [0, 0],
    [1, 0],
  ]

  test('right along the way, left against it: the left line is reversed and stays left', () => {
    const [left, right] = sideLineFeatures(line, {
      'cycleway:right:oneway': 'yes',
      'cycleway:left:oneway': '-1',
    })
    expect(right?.geometry.coordinates).toEqual(line)
    expect(right?.properties.offset).toBe(SIDE_OFFSET_PX.cycleway)
    // Reversed, so the left of the way is the right of the helper line.
    expect(left?.geometry.coordinates).toEqual([...line].reverse())
    expect(left?.properties.offset).toBe(SIDE_OFFSET_PX.cycleway)
    expect(left?.properties.arrows).toBe(true)
  })

  test('both directions: a line without arrows', () => {
    const [feature] = sideLineFeatures(line, { 'sidewalk:left:oneway': 'no' })
    expect(feature?.properties).toEqual({
      kind: 'sidewalk',
      arrows: false,
      offset: -SIDE_OFFSET_PX.sidewalk,
    })
  })
})
