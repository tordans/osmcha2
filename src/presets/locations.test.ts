// Ported from MAID, `packages/presets/src/locations.test.ts` (the tests that do not need
// location-conflation), at MAID commit 24060cc.
import { describe, expect, it } from 'vitest'
import data from './data/matching-presets.json'
import { createLocationMatcher, regionSetOf } from './locations.ts'
import { createPresetMatcher } from './matcher.ts'
import type { LonLat, PresetRecord } from './types.ts'

// Coordinates chosen well inside their countries.
const PARIS: LonLat = [2.3522, 48.8566]
const BERLIN: LonLat = [13.405, 52.52]
const MANILA: LonLat = [120.9842, 14.5995]
const NEW_YORK: LonLat = [-74.006, 40.7128]
const OCEAN: LonLat = [-120, -30]

describe('matchesLocation', () => {
  it('holds everywhere when there is no location set', () => {
    expect(createLocationMatcher().matchesLocation(undefined, PARIS)).toBe(true)
  })

  it('holds for an included country and not for another', () => {
    const locations = createLocationMatcher()
    expect(locations.matchesLocation({ include: ['de'] }, BERLIN)).toBe(true)
    expect(locations.matchesLocation({ include: ['de'] }, PARIS)).toBe(false)
  })

  it('takes codes in any case, as iD does', () => {
    const locations = createLocationMatcher()
    expect(locations.matchesLocation({ include: ['DE'] }, BERLIN)).toBe(true)
    expect(locations.matchesLocation({ include: ['de'] }, BERLIN)).toBe(true)
  })

  it('holds for a group of countries (the union of include)', () => {
    const locations = createLocationMatcher()
    const set = { include: ['DE', 'AT', 'CH'] }
    expect(locations.matchesLocation(set, BERLIN)).toBe(true)
    expect(locations.matchesLocation(set, PARIS)).toBe(false)
  })

  it('takes the exclusions away from the included world', () => {
    const locations = createLocationMatcher()
    const set = { include: ['Planet'], exclude: ['fr'] }
    expect(locations.matchesLocation(set, PARIS)).toBe(false)
    expect(locations.matchesLocation(set, BERLIN)).toBe(true)
    expect(locations.matchesLocation(set, NEW_YORK)).toBe(true)
  })

  it('reads Planet, 001 and Q2 as the world', () => {
    const locations = createLocationMatcher()
    for (const world of ['Planet', '001', 'Q2']) {
      expect(locations.matchesLocation({ include: [world] }, PARIS)).toBe(true)
      expect(locations.matchesLocation({ include: [world] }, OCEAN)).toBe(true)
    }
  })

  it('reads a region by its Wikidata id and its code', () => {
    const locations = createLocationMatcher()
    expect(locations.matchesLocation({ include: ['Q46'] }, PARIS)).toBe(true)
    expect(locations.matchesLocation({ include: ['Q46'] }, NEW_YORK)).toBe(false)
    expect(locations.matchesLocation({ include: ['EU'] }, BERLIN)).toBe(true)
    expect(locations.matchesLocation({ include: ['EU'] }, NEW_YORK)).toBe(false)
  })

  it('does not change the set it is given', () => {
    const set = { include: ['de'] }
    createLocationMatcher().matchesLocation(set, BERLIN)
    expect(set).toEqual({ include: ['de'] })
  })

  it('answers a different set for the same point again', () => {
    const locations = createLocationMatcher()
    expect(locations.matchesLocation({ include: ['de'] }, PARIS)).toBe(false)
    expect(locations.matchesLocation({ include: ['fr'] }, PARIS)).toBe(true)
    expect(locations.matchesLocation({ include: ['de'] }, PARIS)).toBe(false)
  })

  it('does not hold at a point that is not on Earth', () => {
    expect(createLocationMatcher().matchesLocation({ include: ['Planet'] }, [500, 0])).toBe(false)
  })

  // MAID falls back to location-conflation for these, which reads them as the world. Here they never match.
  it('does not hold for a set that is not made of regions', () => {
    const locations = createLocationMatcher()
    expect(locations.matchesLocation({}, PARIS)).toBe(false)
    expect(locations.matchesLocation({ include: ['zz'] }, PARIS)).toBe(false)
    expect(locations.matchesLocation({ include: ['de'], exclude: ['zz'] }, BERLIN)).toBe(false)
  })
})

describe('the location sets of the schema', () => {
  const records = data as PresetRecord[]

  // The matcher answers region sets only. Fails when the schema gets a set that is not region-only
  // (a point with a radius, a geojson file): then location-conflation is needed again, as in MAID.
  it('are all made of country-coder regions', () => {
    const unreadable = records
      .filter((record) => record.locationSet && !regionSetOf(record.locationSet))
      .map((record) => record.id)
    expect(unreadable).toEqual([])
  })

  it('each hold somewhere (none is disabled everywhere: the generator leaves those out)', () => {
    const locations = createLocationMatcher()
    const LONDON: LonLat = [-0.1276, 51.5072]
    const SYDNEY: LonLat = [151.2093, -33.8688]
    const AMSTERDAM: LonLat = [4.9041, 52.3676]
    const places = [PARIS, BERLIN, MANILA, NEW_YORK, LONDON, SYDNEY, AMSTERDAM]
    const never = records
      .filter(
        (record) =>
          record.locationSet &&
          !places.some((place) => locations.matchesLocation(record.locationSet, place)),
      )
      .map((record) => record.id)
    // the chitalishte is for Bulgaria, none of the places is there; every other set holds in one of them
    expect(never).toEqual(['amenity/community_centre/chitalishte_BG'])
  })
})

describe('the Berlin foot-cycle path', () => {
  const locations = createLocationMatcher()
  const matcher = createPresetMatcher(data as PresetRecord[], locations)
  const tags = { highway: 'path', bicycle: 'designated', foot: 'designated' }

  it('is a Shared Path in Germany, and the generic Path or Cycleway elsewhere', () => {
    expect(matcher.needsLocation(tags, 'line')).toBe(true)
    expect(matcher.match(tags, 'line', BERLIN).id).toBe('highway/path/bicycle_foot')
    expect(matcher.match(tags, 'line', NEW_YORK).id).not.toBe('highway/path/bicycle_foot')
  })

  it('is judged by its place for a cycleway with foot=designated', () => {
    const cycleway = { highway: 'cycleway', foot: 'designated' }
    expect(matcher.match(cycleway, 'line', NEW_YORK).id).toBe('highway/cycleway/bicycle_foot')
    expect(matcher.match(cycleway, 'line', BERLIN).id).not.toBe('highway/cycleway/bicycle_foot')
  })

  it('takes the motorway_link of the US preset only in the US', () => {
    const link = { highway: 'motorway_link' }
    expect(matcher.match(link, 'line', BERLIN).id).toBe('highway/motorway_link')
    expect(matcher.match(link, 'line', NEW_YORK).id).toBe('highway/motorway_link-US-CA')
  })
})
