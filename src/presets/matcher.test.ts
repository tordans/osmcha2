// Ported from MAID, `packages/presets/src/id-index.test.ts`, `id-preset.test.ts` (matchScore, isFallback) and
// `presets.test.ts` (match, areaKeys), which are ports of iD's test/spec/presets (ISC, (c) iD contributors),
// at MAID commit 24060cc. The tests that run on the real data use the trimmed file this app ships.
import { describe, expect, it } from 'vitest'
import data from './data/matching-presets.json'
import { createPresetMatcher, matchScore } from './matcher.ts'
import type { Geometry, LocationMatcher, Preset, PresetRecord, Tags } from './types.ts'

function matcherOf(records: Array<Partial<PresetRecord> & { id: string }>) {
  return createPresetMatcher(
    records.map((record) => ({ name: record.id, geometry: [], tags: {}, ...record })),
  )
}

function presetOf(matcher: ReturnType<typeof matcherOf>, id: string): Preset {
  const preset = matcher.preset(id)
  if (!preset) throw new Error(`no preset ${id}`)
  return preset
}

describe('iD.presetIndex', () => {
  describe('#init', () => {
    // The fallback presets are built in, one for each geometry.
    const matcher = matcherOf([])

    it('has a fallback point preset', () => {
      expect(matcher.match({}, 'point').id).toEqual('point')
    })

    it('has a fallback line preset', () => {
      expect(matcher.match({}, 'line').id).toEqual('line')
    })

    it('has a fallback area preset', () => {
      expect(matcher.match({ area: 'yes' }, 'area').id).toEqual('area')
    })

    it('has a fallback relation preset', () => {
      expect(matcher.match({}, 'relation').id).toEqual('relation')
    })
  })

  describe('#match', () => {
    const matcher = matcherOf([
      { id: 'residential', tags: { highway: 'residential' }, geometry: ['line'] },
      { id: 'park', tags: { leisure: 'park' }, geometry: ['point', 'area'] },
    ])

    it('returns the preset matching a geometry and tags', () => {
      expect(matcher.match({ highway: 'residential' }, 'line').id).toEqual('residential')
    })

    it('returns the appropriate fallback preset when no tags match', () => {
      expect(matcher.match({}, 'point').id).toEqual('point')
      expect(matcher.match({ foo: 'bar' }, 'line').id).toEqual('line')
    })

    it('matches vertices on a line as points', () => {
      // park has no vertex geometry, so a vertex with leisure=park falls back to the point preset
      expect(matcher.match({ leisure: 'park' }, 'vertex').id).toEqual('point')
    })
  })

  describe('#areaKeys', () => {
    const matcher = matcherOf([
      {
        id: 'amenity/fuel/shell',
        tags: { amenity: 'fuel' },
        geometry: ['point', 'area'],
        replacement: true,
      },
      { id: 'highway/foo', tags: { highway: 'foo' }, geometry: ['area'] },
      { id: 'leisure/track', tags: { leisure: 'track' }, geometry: ['line', 'area'] },
      { id: 'natural', tags: { natural: '*' }, geometry: ['point', 'vertex', 'area'] },
      { id: 'natural/peak', tags: { natural: 'peak' }, geometry: ['point', 'vertex'] },
      { id: 'natural/tree_row', tags: { natural: 'tree_row' }, geometry: ['line'] },
      { id: 'natural/wood', tags: { natural: 'wood' }, geometry: ['point', 'area'] },
    ])
    const areaKeys = matcher.areaKeys()

    it('includes keys for presets with area geometry', () => {
      expect(areaKeys.has('natural')).toBe(true)
    })

    it('discards key-values for presets with a line geometry', () => {
      expect(areaKeys.get('natural')?.has('tree_row')).toBe(true)
    })

    it('discards key-values for presets with both area and line geometry', () => {
      expect(areaKeys.get('leisure')?.has('track')).toBe(true)
    })

    it('does not discard key-values for presets with neither area nor line geometry', () => {
      expect(areaKeys.get('natural')?.has('peak')).toBe(false)
    })

    it("does not discard generic '*' key-values", () => {
      expect(areaKeys.get('natural')?.has('natural')).toBe(false)
    })

    it("ignores keys like 'highway' that are assumed to be lines", () => {
      expect(areaKeys.has('highway')).toBe(false)
    })

    it('ignores deprecated presets', () => {
      expect(areaKeys.has('amenity')).toBe(false)
    })
  })

  describe('expected matches', () => {
    const matcher = matcherOf([
      { id: 'building', name: 'Building', tags: { building: 'yes' }, geometry: ['area'] },
      {
        id: 'type/multipolygon',
        name: 'Multipolygon',
        geometry: ['area', 'relation'],
        tags: { type: 'multipolygon' },
        searchable: false,
        matchScore: 0.1,
      },
      {
        id: 'address',
        name: 'Address',
        geometry: ['point', 'vertex', 'area'],
        tags: { 'addr:*': '*' },
        matchScore: 0.15,
      },
      {
        id: 'highway/pedestrian_area',
        name: 'Pedestrian Area',
        geometry: ['area'],
        tags: { highway: 'pedestrian', area: 'yes' },
      },
    ])

    it('prefers building to multipolygon', () => {
      expect(matcher.match({ type: 'multipolygon', building: 'yes' }, 'area').id).toEqual(
        'building',
      )
    })

    it('prefers building to address', () => {
      expect(
        matcher.match({ area: 'yes', building: 'yes', 'addr:housenumber': '1234' }, 'area').id,
      ).toEqual('building')
    })

    it('prefers pedestrian to area', () => {
      expect(matcher.match({ area: 'yes', highway: 'pedestrian' }, 'area').id).toEqual(
        'highway/pedestrian_area',
      )
    })
  })
})

describe('iD.presetPreset', () => {
  describe('#matchScore', () => {
    it('returns -1 if preset does not match tags', () => {
      const matcher = matcherOf([{ id: 'test', tags: { foo: 'bar' } }])
      expect(matchScore(presetOf(matcher, 'test'), { highway: 'motorway' })).toEqual(-1)
    })

    it('returns the value of the matchScore property when matched', () => {
      const matcher = matcherOf([{ id: 'test', tags: { highway: 'motorway' }, matchScore: 0.2 }])
      expect(matchScore(presetOf(matcher, 'test'), { highway: 'motorway' })).toEqual(0.2)
    })

    it('defaults to the number of matched tags', () => {
      const one = matcherOf([{ id: 'test', tags: { highway: 'residential' } }])
      expect(matchScore(presetOf(one, 'test'), { highway: 'residential' })).toEqual(1)
      const two = matcherOf([{ id: 'test', tags: { highway: 'service', service: 'alley' } }])
      expect(matchScore(presetOf(two, 'test'), { highway: 'service', service: 'alley' })).toEqual(2)
    })

    it('counts * as a match for any value with score 0.5', () => {
      const matcher = matcherOf([{ id: 'test', tags: { building: '*' } }])
      expect(matchScore(presetOf(matcher, 'test'), { building: 'yep' })).toEqual(0.5)
    })

    it('boosts matchScore for additional matches in addTags', () => {
      const matcher = matcherOf([
        {
          id: 'shop/supermarket/walmart_supercenter',
          tags: { 'brand:wikidata': 'Q483551', shop: 'supermarket' },
          addTags: { name: 'Walmart Supercenter' },
        },
        {
          id: 'shop/supermarket/walmart_market',
          tags: { 'brand:wikidata': 'Q483551', shop: 'supermarket' },
          addTags: { name: 'Walmart Neighborhood Market' },
        },
      ])
      const supercenterPreset = presetOf(matcher, 'shop/supermarket/walmart_supercenter')
      const marketPreset = presetOf(matcher, 'shop/supermarket/walmart_market')
      const supercenter = {
        'brand:wikidata': 'Q483551',
        shop: 'supermarket',
        name: 'Walmart Supercenter',
      }
      const market = {
        'brand:wikidata': 'Q483551',
        shop: 'supermarket',
        name: 'Walmart Neighborhood Market',
      }
      expect(matchScore(supercenterPreset, supercenter)).toBeGreaterThan(
        matchScore(marketPreset, supercenter),
      )
      expect(matchScore(marketPreset, market)).toBeGreaterThan(
        matchScore(supercenterPreset, market),
      )
    })

    it('lowers the score of a preset that is not searchable a little', () => {
      const matcher = matcherOf([{ id: 'test', tags: { foo: 'bar' }, searchable: false }])
      expect(matchScore(presetOf(matcher, 'test'), { foo: 'bar' })).toBeCloseTo(0.999)
    })
  })

  describe('isFallback', () => {
    it('is true for the generic point, line and relation presets (no tags)', () => {
      const matcher = matcherOf([])
      expect(matcher.isFallback(presetOf(matcher, 'point'))).toEqual(true)
      expect(matcher.isFallback(presetOf(matcher, 'line'))).toEqual(true)
      expect(matcher.isFallback(presetOf(matcher, 'relation'))).toEqual(true)
    })

    it('is true for the generic area preset (area=yes only)', () => {
      const matcher = matcherOf([])
      expect(presetOf(matcher, 'area').tags).toEqual({ area: 'yes' })
      expect(matcher.isFallback(presetOf(matcher, 'area'))).toEqual(true)
    })

    it('is false for a preset with a tag of its own, on any geometry', () => {
      const matcher = matcherOf([
        { id: 'bench', tags: { amenity: 'bench' }, geometry: ['point', 'vertex'] },
        { id: 'route', tags: { type: 'route' }, geometry: ['relation'] },
        { id: 'footway', tags: { highway: 'footway', area: 'yes' }, geometry: ['area'] },
      ])
      expect(matcher.isFallback(presetOf(matcher, 'bench'))).toEqual(false)
      expect(matcher.isFallback(presetOf(matcher, 'route'))).toEqual(false)
      expect(matcher.isFallback(presetOf(matcher, 'footway'))).toEqual(false)
    })

    it('answers the same for the preset a match finds', () => {
      const matcher = matcherOf([
        { id: 'bench', tags: { amenity: 'bench' }, geometry: ['point', 'vertex'] },
        { id: 'route', tags: { type: 'route' }, geometry: ['relation'] },
      ])
      const answer = (tags: Tags, geometry: Geometry) =>
        matcher.isFallback(matcher.match(tags, geometry))
      expect(answer({}, 'point')).toEqual(true)
      expect(answer({}, 'vertex')).toEqual(true)
      expect(answer({ area: 'yes' }, 'area')).toEqual(true)
      expect(answer({}, 'relation')).toEqual(true)
      expect(answer({ amenity: 'bench' }, 'point')).toEqual(false)
      expect(answer({ amenity: 'bench' }, 'vertex')).toEqual(false)
      expect(answer({ type: 'route' }, 'relation')).toEqual(false)
    })
  })
})

describe('osmWay.isArea', () => {
  const matcher = matcherOf([
    { id: 'building', tags: { building: '*' }, geometry: ['area'] },
    { id: 'man_made', tags: { man_made: '*' }, geometry: ['point', 'area'] },
    { id: 'man_made/pipeline', tags: { man_made: 'pipeline' }, geometry: ['line'] },
    { id: 'amenity/parking', tags: { amenity: 'parking' }, geometry: ['area'] },
    { id: 'amenity', tags: { amenity: '*' }, geometry: ['area'] },
    { id: 'highway', tags: { highway: '*' }, geometry: ['line'] },
  ])

  it('is an area with area=yes, closed or not', () => {
    expect(matcher.isArea({ area: 'yes' }, false)).toBe(true)
    expect(matcher.isArea({ area: 'yes', highway: 'footway' }, true)).toBe(true)
  })

  it('is no area with area=no or when the way is not closed', () => {
    expect(matcher.isArea({ building: 'yes', area: 'no' }, true)).toBe(false)
    expect(matcher.isArea({ building: 'yes' }, false)).toBe(false)
  })

  it('is an area when closed and a tag suggests it', () => {
    expect(matcher.isArea({ building: 'yes' }, true)).toBe(true)
    expect(matcher.isArea({ amenity: 'parking' }, true)).toBe(true)
  })

  it('is a line when the value is one that line presets add', () => {
    expect(matcher.isArea({ man_made: 'pipeline' }, true)).toBe(false)
  })

  it('is a line for a closed way with a highway or no tags', () => {
    expect(matcher.isArea({ highway: 'residential' }, true)).toBe(false)
    expect(matcher.isArea({}, true)).toBe(false)
  })

  it('takes the exceptions of iD: closed highway=services is an area, emergency=yes is not a reason', () => {
    expect(matcher.isArea({ highway: 'services' }, true)).toBe(true)
    expect(matcher.isArea({ railway: 'platform' }, true)).toBe(true)
    expect(matcher.isArea({ emergency: 'yes' }, true)).toBe(false)
  })

  it('judges a lifecycle prefix like the key without it', () => {
    expect(matcher.isArea({ 'disused:building': 'yes' }, true)).toBe(true)
    expect(matcher.isArea({ 'name:building': 'yes' }, true)).toBe(false)
  })
})

describe('location sets', () => {
  const inGermany: LocationMatcher = {
    // a stand-in for country-coder: points with lon above 5 are in Germany
    matchesLocation: (set, loc) => {
      if (!set) return true
      const country = loc[0] > 5 ? 'de' : 'fr'
      return (
        (set.include ?? []).includes(country) &&
        !(set.exclude ?? []).some((code) => code === country)
      )
    },
  }
  const records: PresetRecord[] = [
    { id: 'highway/path', name: 'Path', tags: { highway: 'path' }, geometry: ['line'] },
    {
      id: 'highway/path/bicycle_foot',
      name: 'Shared Path',
      tags: { highway: 'path' },
      addTags: { highway: 'path', bicycle: 'designated', foot: 'designated' },
      geometry: ['line'],
      locationSet: { include: ['de'] },
    },
  ]
  const tags = { highway: 'path', bicycle: 'designated', foot: 'designated' }

  it('says a location is needed when the best candidate is limited to a region', () => {
    const matcher = createPresetMatcher(records, inGermany)
    expect(matcher.needsLocation(tags, 'line')).toBe(true)
    expect(matcher.needsLocation({ highway: 'path' }, 'line')).toBe(false)
    expect(matcher.needsLocation({}, 'line')).toBe(false)
  })

  it('takes the next best preset where the best one does not hold', () => {
    const matcher = createPresetMatcher(records, inGermany)
    expect(matcher.match(tags, 'line', [13.4, 52.5]).id).toBe('highway/path/bicycle_foot')
    expect(matcher.match(tags, 'line', [2.3, 48.8]).id).toBe('highway/path')
  })

  it('ignores location sets without a location, as iD does', () => {
    expect(createPresetMatcher(records, inGermany).match(tags, 'line').id).toBe(
      'highway/path/bicycle_foot',
    )
  })

  it('refuses a location when it was made without a LocationMatcher', () => {
    expect(() => createPresetMatcher(records).match(tags, 'line', [13.4, 52.5])).toThrow()
  })

  it('keeps the address fallback when no candidate holds', () => {
    const matcher = createPresetMatcher(
      [
        ...records,
        {
          id: 'address',
          name: 'Address',
          tags: { 'addr:*': '*' },
          geometry: ['line'],
          matchScore: 0.15,
        },
      ],
      inGermany,
    )
    expect(matcher.match({ 'addr:street': 'x' }, 'line', [2.3, 48.8]).id).toBe('address')
  })
})

describe('with the schema data', () => {
  const matcher = createPresetMatcher(data as PresetRecord[])

  it('matches amenity=cafe as a point to Cafe', () => {
    expect(matcher.match({ amenity: 'cafe' }, 'point').name).toBe('Cafe')
  })

  it('matches highway=residential as a line to Residential Road, as an area to the generic highway preset', () => {
    expect(matcher.match({ highway: 'residential' }, 'line').name).toBe('Residential Road')
    expect(matcher.match({ highway: 'residential' }, 'area').id).toBe('highway')
  })

  it('prefers building=house to the wildcard building', () => {
    expect(matcher.match({ building: 'house' }, 'area').id).toBe('building/house')
    expect(matcher.match({ building: 'yes' }, 'area').id).toBe('building')
  })

  it('uses the Address preset when only addr:* tags are present', () => {
    expect(matcher.match({ 'addr:housenumber': '5' }, 'point').id).toBe('address')
  })

  it('falls back to the generic preset of the geometry', () => {
    expect(matcher.match({}, 'point').name).toBe('Point')
    expect(matcher.match({}, 'vertex').name).toBe('Point')
    expect(matcher.match({ 'xyz:unknown': 'v' }, 'line').name).toBe('Line')
    expect(matcher.match({}, 'area').name).toBe('Area')
    expect(matcher.match({}, 'relation').name).toBe('Relation')
  })

  it('has the area keys iD derives', () => {
    const areaKeys = matcher.areaKeys()
    expect(areaKeys.get('building')?.size).toBe(0)
    expect(areaKeys.get('man_made')?.has('pipeline')).toBe(true)
    expect(areaKeys.get('leisure')?.has('slipway')).toBe(true)
    expect(areaKeys.has('highway')).toBe(false)
  })

  it('tells a closed way with building=yes from one with highway=footway', () => {
    expect(matcher.isArea({ building: 'yes' }, true)).toBe(true)
    expect(matcher.isArea({ highway: 'footway' }, true)).toBe(false)
    expect(matcher.isArea({ highway: 'pedestrian', area: 'yes' }, false)).toBe(true)
  })

  it('needs a location for the regional presets only', () => {
    expect(matcher.needsLocation({ highway: 'motorway_link' }, 'line')).toBe(true)
    expect(matcher.needsLocation({ highway: 'residential' }, 'line')).toBe(false)
    expect(matcher.needsLocation({ amenity: 'cafe' }, 'point')).toBe(false)
  })
})
