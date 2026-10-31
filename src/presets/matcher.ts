// Which preset iD shows for an object: the matching part of iD's `presetIndex` (modules/presets/index.ts:
// `matchTags`, `areaKeys`), `presetPreset.matchScore` and `isFallback` (modules/presets/preset.ts), and
// `osmTagSuggestingArea` (modules/osm/tags.ts).
//
// Ported from MAID, `packages/presets/src/presets.ts` (`matchScore`, `isFallbackTags`, `matchesRanked`,
// `match`, the per-key candidate index, the generic fallback presets, the area keys), at MAID commit
// 24060cc. MAID is ISC (c) 2026 Maid contributors and itself follows iD, ISC (c) iD contributors, see
// NOTICE.md. The code is kept close to MAID's so that it can be replaced by a package later: what MAID
// does besides matching (fields, search, tag changes, deprecations, defaults) is not here.
//
// Differences from MAID:
// - The preset data is the trimmed list of `PresetRecord` (see `generate.ts`), names already resolved.
// - Location sets are answered by a `LocationMatcher` that the caller passes (`locations.ts`, which needs
//   country-coder); this file has no dependency. `needsLocation` tells whether a match depends on it.
import type {
  Geometry,
  LocationMatcher,
  LocationSet,
  LonLat,
  Preset,
  PresetRecord,
  Tags,
} from './types.ts'

// iD seeds these four and the data then replaces them (keeping their place in the order).
const GENERIC_PRESETS: PresetRecord[] = [
  { id: 'point', name: 'Point', tags: {}, geometry: ['point', 'vertex'], matchScore: 0.1 },
  { id: 'line', name: 'Line', tags: {}, geometry: ['line'], matchScore: 0.1 },
  { id: 'area', name: 'Area', tags: { area: 'yes' }, geometry: ['area'], matchScore: 0.1 },
  { id: 'relation', name: 'Relation', tags: {}, geometry: ['relation'], matchScore: 0.1 },
]

// iD's areaKeys ignores keys that imply lines.
const AREA_KEY_IGNORE: ReadonlySet<string> = new Set([
  'barrier',
  'highway',
  'footway',
  'railway',
  'junction',
  'type',
])

/**
 * iD's osmAreaKeysExceptions (modules/osm/tags.ts): values that make a key an area without `area=yes`.
 * The `false` entries of `emergency` make it a line again.
 */
const AREA_KEY_EXCEPTIONS: ReadonlyMap<string, ReadonlyMap<string, boolean>> = new Map([
  [
    'highway',
    new Map([
      ['elevator', true],
      ['rest_area', true],
      ['services', true],
    ]),
  ],
  ['public_transport', new Map([['platform', true]])],
  [
    'railway',
    new Map(
      [
        'platform',
        'roundhouse',
        'station',
        'traverser',
        'turntable',
        'wash',
        'ventilation_shaft',
      ].map((value) => [value, true]),
    ),
  ],
  ['waterway', new Map([['dam', true]])],
  ['amenity', new Map([['bicycle_parking', true]])],
  [
    'emergency',
    new Map(
      ['yes', 'no', 'private', 'designated', 'destination', 'official'].map((value) => [
        value,
        false,
      ]),
    ),
  ],
])

/** iD's osmLifecyclePrefixes: `disused:amenity=cafe` is judged like `amenity=cafe`. */
const LIFECYCLE_PREFIXES: ReadonlySet<string> = new Set([
  'proposed',
  'planned',
  'construction',
  'disused',
  'abandoned',
  'was',
  'dismantled',
  'razed',
  'demolished',
  'destroyed',
  'removed',
  'intermittent',
])

function removeLifecyclePrefix(key: string) {
  const colon = key.indexOf(':')
  if (colon < 0) return key
  return LIFECYCLE_PREFIXES.has(key.slice(0, colon)) ? key.slice(colon + 1) : key
}

/** iD's presetPreset.matchScore: -1 when a tag of the preset is missing or different. */
export function matchScore(preset: Preset, entityTags: Tags) {
  let score = 0
  for (const key in preset.tags) {
    const wanted = preset.tags[key]
    if (entityTags[key] === wanted) {
      score += preset.matchScore
    } else if (wanted === '*' && Object.hasOwn(entityTags, key)) {
      score += preset.matchScore / 2
    } else {
      return -1
    }
  }
  // iD: boost for additional matches in addTags (#6802); keys already counted above are skipped
  for (const key in preset.addTags) {
    if (Object.hasOwn(preset.tags, key)) continue
    if (entityTags[key] === preset.addTags[key]) score += preset.matchScore
  }
  if (!preset.searchable) score *= 0.999
  return score
}

/** iD's isFallback(): no tags, or only area=*. */
function isFallbackTags(tags: Tags) {
  const keys = Object.keys(tags)
  return keys.length === 0 || (keys.length === 1 && keys[0] === 'area')
}

function presetOf(record: PresetRecord): Preset {
  const preset: Preset = {
    id: record.id,
    name: record.name,
    geometry: record.geometry,
    tags: record.tags,
    addTags: record.addTags ?? record.tags,
    // as MAID: 0 and absent both mean 1
    matchScore: record.matchScore ? record.matchScore : 1,
    searchable: record.searchable !== false,
  }
  if (record.locationSet !== undefined) preset.locationSet = record.locationSet
  return preset
}

export type PresetMatcher = ReturnType<typeof createPresetMatcher>

export function createPresetMatcher(records: readonly PresetRecord[], locations?: LocationMatcher) {
  // Presets: the records (seeds first, then the data replaces them in place).
  const recordsById = new Map<string, PresetRecord>()
  for (const record of GENERIC_PRESETS) recordsById.set(record.id, record)
  for (const record of records) recordsById.set(record.id, record)
  const presets = new Map<string, Preset>()
  for (const [id, record] of recordsById) presets.set(id, presetOf(record))

  // iD's _geometryIndex: geometry → tag key → tag value → presets, in preset order.
  const index: Record<Geometry, Map<string, Map<string, Preset[]>>> = {
    point: new Map(),
    vertex: new Map(),
    line: new Map(),
    area: new Map(),
    relation: new Map(),
  }
  for (const preset of presets.values()) {
    for (const geometry of preset.geometry) {
      const byKey = index[geometry]
      for (const [key, value] of Object.entries(preset.tags)) {
        let byValue = byKey.get(key)
        if (!byValue) {
          byValue = new Map()
          byKey.set(key, byValue)
        }
        const list = byValue.get(value)
        if (list) list.push(preset)
        else byValue.set(value, [preset])
      }
    }
  }

  function genericOf(id: string) {
    const preset = presets.get(id)
    if (!preset) throw new Error(`Missing generic preset ${id}`)
    return preset
  }
  const generic: Record<Geometry, Preset> = {
    point: genericOf('point'),
    vertex: genericOf('point'),
    line: genericOf('line'),
    area: genericOf('area'),
    relation: genericOf('relation'),
  }

  function here(locationSet: LocationSet | undefined, loc: LonLat | undefined) {
    if (loc === undefined || locationSet === undefined) return true
    if (!locations) throw new Error('A location was given but the matcher has no LocationMatcher')
    return locations.matchesLocation(locationSet, loc)
  }

  // iD's matchCandidates: every preset that matches these tags with its score, the best score first. The sort is
  // stable, so equal scores keep the order of the keys and of the index.
  function matchesRanked(tags: Tags, geometry: Geometry) {
    const byKey = index[geometry]
    const found: Array<{ preset: Preset; score: number }> = []
    for (const key in tags) {
      const byValue = byKey.get(key)
      if (!byValue) continue
      const value = tags[key]
      if (value === undefined) continue
      // exact value first, then presets with `*` for this key (iD's order)
      for (let pass = 0; pass < 2; pass++) {
        const list = byValue.get(pass === 0 ? value : '*')
        if (!list) continue
        for (const candidate of list) {
          const score = matchScore(candidate, tags)
          if (score !== -1) found.push({ preset: candidate, score })
        }
      }
    }
    return found.sort((a, b) => b.score - a.score)
  }

  /** The best candidate of the tags, as iD's matchTags finds it before the location is looked at. */
  function bestCandidate(tags: Tags, geometry: Geometry) {
    const byKey = index[geometry]
    let best: Preset | undefined
    let bestScore = -1
    for (const key in tags) {
      const byValue = byKey.get(key)
      if (!byValue) continue
      const value = tags[key]
      if (value === undefined) continue
      for (let pass = 0; pass < 2; pass++) {
        const list = byValue.get(pass === 0 ? value : '*')
        if (!list) continue
        for (const candidate of list) {
          const score = matchScore(candidate, tags)
          if (score === -1) continue
          if (score > bestScore) {
            bestScore = score
            best = candidate
          }
        }
      }
    }
    return best
  }

  /**
   * True when the answer of `match` can depend on where the object is: the best candidate is limited to
   * a region. Only then is a location needed; for every other object `match` without one is final, as iD
   * looks at the location only when the best candidate has a location set.
   */
  function needsLocation(tags: Tags, geometry: Geometry) {
    return bestCandidate(tags, geometry)?.locationSet !== undefined
  }

  /**
   * iD's matchTags. Without `loc` every location set holds (iD does the same without a location); call
   * `needsLocation` first when a wrong answer would be worse than none.
   */
  function match(tags: Tags, geometry: Geometry, loc?: LonLat): Preset {
    let best = bestCandidate(tags, geometry)

    // as iD's matchTags: when the best preset does not hold at this place, the best one that does is taken
    if (best !== undefined && !here(best.locationSet, loc)) {
      best = matchesRanked(tags, geometry).find(({ preset }) =>
        here(preset.locationSet, loc),
      )?.preset
    }

    // iD: if any part of an address is present, the "Address" preset is the fallback (#4353)
    if (best === undefined || isFallbackTags(best.tags)) {
      const address = index[geometry].get('addr:*')?.get('*')?.[0]
      if (address !== undefined) {
        for (const key in tags) {
          if (key.startsWith('addr:')) {
            best = address
            break
          }
        }
      }
    }

    return best ?? generic[geometry]
  }

  // iD's areaKeys (index.js): a keeplist of keys from area presets, and per key the values that are lines.
  const areaKeys = new Map<string, Set<string>>()
  const areaPresets = [...presets.values()].filter(
    (preset) => !recordsById.get(preset.id)?.replacement,
  )
  for (const preset of areaPresets) {
    const key = Object.keys(preset.tags)[0]
    if (key === undefined || AREA_KEY_IGNORE.has(key)) continue
    if (preset.geometry.includes('area') && !areaKeys.has(key)) areaKeys.set(key, new Set())
  }
  for (const preset of areaPresets) {
    if (!preset.geometry.includes('line')) continue
    for (const key in preset.addTags) {
      const value = preset.addTags[key]
      if (value === undefined || value === '*') continue
      areaKeys.get(key)?.add(value)
    }
  }

  /**
   * iD's osmWay.isArea (`osmTagSuggestingArea`): `area=yes`, or a closed way with a tag that suggests an
   * area, unless `area=no`. A way is closed when its first and last node are the same node.
   */
  function isArea(tags: Tags, closed: boolean) {
    if (tags.area === 'yes') return true
    if (!closed || tags.area === 'no') return false
    for (const realKey in tags) {
      const value = tags[realKey]
      if (value === undefined) continue
      const key = removeLifecyclePrefix(realKey)
      const exceptions = AREA_KEY_EXCEPTIONS.get(key)
      if (exceptions?.get(value) === false) continue
      const lines = areaKeys.get(key)
      if (lines && !lines.has(value)) return true
      if (exceptions?.has(value)) return true
    }
    return false
  }

  return {
    match,
    needsLocation,
    isArea,
    matchScore,
    isFallback: (preset: Preset) => isFallbackTags(preset.tags),
    preset: (id: string) => presets.get(id),
    areaKeys: () => areaKeys,
  }
}
