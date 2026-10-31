// Where a preset applies: iD's location sets, answered from country-coder alone.
//
// Ported from MAID, `packages/presets/src/locations.ts` (`regionSetOf`, `isValidPoint`, the region branch of
// `matchesLocation`), at MAID commit 24060cc, ISC (c) 2026 Maid contributors, see NOTICE.md. MAID falls back
// to `@rapideditor/location-conflation` for a set that is not made of country-coder regions; every location
// set in the id-tagging-schema is region-only today, so that fallback is left out here and such a set never
// matches. `locations.test.ts` fails when the schema data gets a set that is not region-only.
//
// country-coder carries the country borders (about 235 KB gzip). Import this file lazily, only when an
// object needs a location (`PresetMatcher.needsLocation`).
import { feature as regionFeature, wikidataQIDs } from '@rapideditor/country-coder'
import type { LocationMatcher, LocationSet, LonLat } from './types.ts'

/** The Wikidata id country-coder gives the world (`Planet`, `001`, `Q2`) */
const WORLD_QID = 'Q2'

/**
 * A location set made only of country-coder regions, as lists of Wikidata ids. location-conflation answers
 * such a set from the regions at the point (country-coder's `featuresContaining`: the region and every group
 * that contains it): a set holds a point when one of its included regions is at the point and none of the
 * excluded ones.
 */
type RegionSet = {
  include: readonly string[]
  exclude: readonly string[]
  /** `Planet` alone: the world, which holds at every valid point, the sea included */
  worldOnly: boolean
}

/** The region set of a location set, or undefined when it holds anything but country-coder regions. */
export function regionSetOf(set: LocationSet): RegionSet | undefined {
  const qids = (codes: readonly unknown[] | undefined) => {
    const out: string[] = []
    for (const code of codes ?? []) {
      if (typeof code !== 'string' && typeof code !== 'number') return undefined
      const qid = regionFeature(code)?.properties.wikidata
      if (qid === undefined) return undefined
      out.push(qid)
    }
    return out
  }
  const include = qids(set.include)
  const exclude = qids(set.exclude)
  // no include: the engine refuses the set and the caller treats it as the world
  if (!include?.length || !exclude) return undefined
  return {
    include,
    exclude,
    worldOnly: include.length === 1 && include[0] === WORLD_QID && exclude.length === 0,
  }
}

/** location-conflation answers nothing for a point that is not a valid longitude and latitude */
function isValidPoint([lon, lat]: LonLat) {
  return (
    Number.isFinite(lon) &&
    lon >= -180 &&
    lon <= 180 &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90
  )
}

export function createLocationMatcher(): LocationMatcher {
  const regionSets = new WeakMap<LocationSet, RegionSet | null>()
  let lastRegions: { loc: LonLat; value: ReadonlySet<string> } | undefined

  /** The regions at a point, for the last point asked (the candidates of one object ask again) */
  function regionsAt(loc: LonLat) {
    if (lastRegions && lastRegions.loc[0] === loc[0] && lastRegions.loc[1] === loc[1]) {
      return lastRegions.value
    }
    const value = new Set(wikidataQIDs([loc[0], loc[1]]))
    lastRegions = { loc, value }
    return value
  }

  return {
    matchesLocation(locationSet, loc) {
      if (locationSet === undefined) return true
      let regions = regionSets.get(locationSet)
      if (regions === undefined) {
        regions = regionSetOf(locationSet) ?? null
        regionSets.set(locationSet, regions)
      }
      // not region-only (cannot occur in the schema, see the header), or not a point on Earth
      if (regions === null || !isValidPoint(loc)) return false
      if (regions.worldOnly) return true
      const here = regionsAt(loc)
      return (
        regions.include.some((qid) => here.has(qid)) &&
        !regions.exclude.some((qid) => here.has(qid))
      )
    },
  }
}
