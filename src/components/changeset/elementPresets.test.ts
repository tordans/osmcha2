import { describe, expect, it } from 'vitest'
import data from '../../presets/data/matching-presets.json'
import { createLocationMatcher } from '../../presets/locations.ts'
import { createPresetMatcher } from '../../presets/matcher.ts'
import type { PresetRecord } from '../../presets/types.ts'
import { buildElementChanges, type AdiffAction, type ElementChange } from './changesetElements.ts'
import {
  locationOf,
  presetContextOf,
  presetLineOf,
  presetsOfChange,
  tagsOfRows,
} from './elementPresets.ts'

const matcher = createPresetMatcher(data as PresetRecord[], createLocationMatcher())

function changesOf(actions: AdiffAction[]) {
  return buildElementChanges(actions)
}

function lineOfChange(change: ElementChange, actions: AdiffAction[], locationsReady = true) {
  const presets = presetsOfChange(change, presetContextOf(actions), matcher, locationsReady)
  return presetLineOf(presets, matcher.isFallback)
}

function lineOf(actions: AdiffAction[], index = 0, locationsReady = true) {
  const change = changesOf(actions)[index]
  if (!change) throw new Error('no change')
  return lineOfChange(change, actions, locationsReady)
}

const BERLIN = { lon: 13.405, lat: 52.52 }
const NEW_YORK = { lon: -74.006, lat: 40.7128 }

function way(id: number, nodes: number[], tags: Record<string, string>, at = BERLIN) {
  return {
    type: 'way',
    id,
    version: 1,
    tags,
    nodes: nodes.map((ref, index) => ({ ref, lon: at.lon + index * 0.001, lat: at.lat })),
  }
}

describe('tagsOfRows', () => {
  const rows = changesOf([
    {
      type: 'modify',
      old: {
        type: 'node',
        id: 1,
        version: 1,
        ...BERLIN,
        tags: { amenity: 'cafe', name: 'A', cuisine: 'x', 'old:key': 'v' },
      },
      new: {
        type: 'node',
        id: 1,
        version: 2,
        ...BERLIN,
        tags: { amenity: 'cafe', name: 'B', website: 'w', 'new:key': 'v' },
      },
    },
  ])[0]!.tags

  it('puts the old tags together', () => {
    expect(tagsOfRows(rows, 'old')).toEqual({
      amenity: 'cafe',
      name: 'A',
      cuisine: 'x',
      'old:key': 'v',
    })
  })

  it('puts the new tags together, a renamed key included', () => {
    expect(tagsOfRows(rows, 'new')).toEqual({
      amenity: 'cafe',
      name: 'B',
      website: 'w',
      'new:key': 'v',
    })
  })
})

describe('presetLineOf', () => {
  it('names the preset of a created point', () => {
    expect(
      lineOf([
        { type: 'create', new: { type: 'node', id: 1, ...BERLIN, tags: { amenity: 'cafe' } } },
      ]),
    ).toBe('Cafe')
  })

  it('names the old preset of a deleted object', () => {
    expect(
      lineOf([
        { type: 'delete', old: { type: 'node', id: 1, ...BERLIN, tags: { amenity: 'cafe' } } },
      ]),
    ).toBe('Cafe')
  })

  it('shows Old → New when the preset changed', () => {
    expect(
      lineOf([
        {
          type: 'modify',
          old: { type: 'node', id: 1, version: 1, ...BERLIN, tags: { amenity: 'cafe' } },
          new: { type: 'node', id: 1, version: 2, ...BERLIN, tags: { amenity: 'restaurant' } },
        },
      ]),
    ).toBe('Cafe → Restaurant')
  })

  it('shows one name when the preset stays the same', () => {
    expect(
      lineOf([
        {
          type: 'modify',
          old: { type: 'node', id: 1, version: 1, ...BERLIN, tags: { amenity: 'cafe', name: 'A' } },
          new: { type: 'node', id: 1, version: 2, ...BERLIN, tags: { amenity: 'cafe', name: 'B' } },
        },
      ]),
    ).toBe('Cafe')
  })

  it('leaves out a generic fallback, but not when an object lost or got its type', () => {
    expect(
      lineOf([{ type: 'create', new: { type: 'node', id: 1, ...BERLIN, tags: { note: 'x' } } }]),
    ).toBeUndefined()
    expect(
      lineOf([
        {
          type: 'modify',
          old: { type: 'node', id: 1, version: 1, ...BERLIN, tags: { amenity: 'cafe' } },
          new: { type: 'node', id: 1, version: 2, ...BERLIN, tags: { note: 'x' } },
        },
      ]),
    ).toBe('Cafe → Point')
  })
})

describe('geometry', () => {
  it('matches a node on a way as a vertex', () => {
    const node = { type: 'node', id: 5, ...BERLIN, tags: { highway: 'crossing' } }
    const actions: AdiffAction[] = [
      { type: 'create', new: node },
      { type: 'create', new: way(10, [4, 5, 6], { highway: 'footway' }) },
    ]
    expect(lineOf(actions, 0)).toBe('Crossing')
  })

  it('matches a node of a way that is only in the old state when the node is deleted', () => {
    const actions: AdiffAction[] = [
      { type: 'delete', old: { type: 'node', id: 5, ...BERLIN, tags: { highway: 'stop' } } },
      {
        type: 'modify',
        old: way(10, [4, 5, 6], { highway: 'residential' }),
        new: way(10, [4, 6], { highway: 'residential' }),
      },
    ]
    expect(matcher.match({ highway: 'stop' }, 'vertex').name).toBe('Stop Sign')
    expect(lineOf(actions, 0)).toBe('Stop Sign')
  })

  it('takes the vertex preset of a tagged node whose way is not in the adiff, rather than the generic Highway', () => {
    const actions: AdiffAction[] = [
      {
        type: 'modify',
        old: { type: 'node', id: 5, version: 1, ...BERLIN, tags: {} },
        new: { type: 'node', id: 5, version: 2, ...BERLIN, tags: { highway: 'crossing' } },
      },
    ]
    expect(matcher.match({ highway: 'crossing' }, 'point').id).toBe('highway')
    expect(lineOf(actions)).toBe('Point → Crossing')
  })

  it('matches members of an address interpolation line as points', () => {
    const actions: AdiffAction[] = [
      {
        type: 'create',
        new: { type: 'node', id: 5, ...BERLIN, tags: { 'addr:housenumber': '5' } },
      },
      { type: 'create', new: way(10, [4, 5, 6], { 'addr:interpolation': 'even' }) },
    ]
    expect(presetContextOf(actions).vertexNodes.new.has(5)).toBe(false)
    expect(lineOf(actions, 0)).toBe('Address')
  })

  it('matches a closed way with building=yes as an area and a closed footway as a line', () => {
    const actions: AdiffAction[] = [
      { type: 'create', new: way(10, [1, 2, 3, 1], { building: 'yes' }) },
      { type: 'create', new: way(11, [1, 2, 3, 1], { highway: 'footway' }) },
      { type: 'create', new: way(12, [1, 2, 3], { building: 'yes' }) },
      { type: 'create', new: way(13, [1, 2, 3], { highway: 'pedestrian', area: 'yes' }) },
    ]
    expect(lineOf(actions, 0)).toBe('Building')
    expect(lineOf(actions, 1)).toBe('Foot Path')
    // not closed and no area=yes: a line, which no building preset matches
    expect(lineOf(actions, 2)).toBeUndefined()
    expect(lineOf(actions, 3)).toBe('Pedestrian Area')
  })

  it('judges the old and the new state of a way by their own closing node', () => {
    const actions: AdiffAction[] = [
      {
        type: 'modify',
        old: way(10, [1, 2, 3, 1], { building: 'yes' }),
        new: way(10, [1, 2, 3], { building: 'yes' }),
      },
    ]
    expect(lineOf(actions)).toBe('Building → Line')
  })

  it('matches a multipolygon relation as an area', () => {
    const actions: AdiffAction[] = [
      {
        type: 'create',
        new: {
          type: 'relation',
          id: 1,
          tags: { type: 'multipolygon', building: 'yes' },
          members: [],
        },
      },
      {
        type: 'create',
        new: { type: 'relation', id: 2, tags: { type: 'route', route: 'bus' }, members: [] },
      },
    ]
    expect(lineOf(actions, 0)).toBe('Building')
    expect(lineOf(actions, 1)).toBe('Bus Route')
  })
})

describe('location', () => {
  const tags = { highway: 'path', bicycle: 'designated', foot: 'designated' }
  const berlin: AdiffAction[] = [{ type: 'create', new: way(10, [1, 2], tags, BERLIN) }]
  const newYork: AdiffAction[] = [{ type: 'create', new: way(10, [1, 2], tags, NEW_YORK) }]

  it('names the Berlin foot-cycle path Cycle & Foot Path, and a New York one differently', () => {
    expect(lineOf(berlin)).toBe('Cycle & Foot Path')
    expect(lineOf(newYork)).toBe('Path')
  })

  it('is pending until the country borders are loaded, and shows nothing then', () => {
    const change = changesOf(berlin)[0]!
    const presets = presetsOfChange(change, presetContextOf(berlin), matcher, false)
    expect(presets.status).toBe('pending')
    expect(presetLineOf(presets, matcher.isFallback)).toBeUndefined()
  })

  it('answers again once the borders are loaded', () => {
    const change = changesOf(berlin)[0]!
    const context = presetContextOf(berlin)
    expect(presetsOfChange(change, context, matcher, false).status).toBe('pending')
    expect(presetsOfChange(change, context, matcher, true).status).toBe('ready')
  })

  it('does not need the borders for an object with a global preset', () => {
    const cafe: AdiffAction[] = [
      { type: 'create', new: { type: 'node', id: 1, ...BERLIN, tags: { amenity: 'cafe' } } },
    ]
    const change = changesOf(cafe)[0]!
    expect(presetsOfChange(change, presetContextOf(cafe), matcher, false).status).toBe('ready')
  })

  it('has no answer for a regional preset on an object without a place', () => {
    const noPlace: AdiffAction[] = [
      { type: 'create', new: { type: 'way', id: 10, tags, nodes: [{ ref: 1 }, { ref: 2 }] } },
    ]
    const change = changesOf(noPlace)[0]!
    expect(presetsOfChange(change, presetContextOf(noPlace), matcher, true).status).toBe('unknown')
  })

  it('takes a node coordinate and the center of the extent of a way', () => {
    const [node] = changesOf([
      { type: 'create', new: { type: 'node', id: 1, ...BERLIN, tags: { amenity: 'cafe' } } },
    ])
    expect(locationOf(node!)).toEqual([BERLIN.lon, BERLIN.lat])
    const [line] = changesOf([{ type: 'create', new: way(10, [1, 2, 3], { highway: 'footway' }) }])
    expect(locationOf(line!)).toEqual([BERLIN.lon + 0.001, BERLIN.lat])
  })
})

describe('presetContextOf', () => {
  it('returns the same context for the same actions', () => {
    const actions: AdiffAction[] = [{ type: 'create', new: way(10, [1, 2], {}) }]
    expect(presetContextOf(actions)).toBe(presetContextOf(actions))
  })

  it('reads the unchanged ways of the adiff too', () => {
    const actions: AdiffAction[] = [{ type: 'noop', old: way(10, [1, 2], { highway: 'footway' }) }]
    expect(presetContextOf(actions).vertexNodes.old.has(2)).toBe(true)
  })
})
