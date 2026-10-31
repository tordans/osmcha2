export type Tags = Record<string, string>
export type Geometry = 'point' | 'vertex' | 'line' | 'area' | 'relation'
export type LonLat = readonly [number, number]

/**
 * iD's `locationSet`: the places where a preset applies. `include` and `exclude` are country-coder
 * regions (ISO codes in any case, `Q46`, `Planet`). The set is the union of `include` less the union of
 * `exclude`. Absent: everywhere.
 */
export type LocationSet = { include?: string[]; exclude?: string[] }

/**
 * One preset as the matcher needs it (see `generate.ts`, which cuts these from the id-tagging-schema).
 * `name` is the English name, already resolved (a `{other/preset}` reference is followed at generation time).
 */
export type PresetRecord = {
  id: string
  name: string
  geometry: Geometry[]
  tags: Tags
  /** The schema's `addTags`; absent when it equals `tags` */
  addTags?: Tags
  /** Default 1 */
  matchScore?: number
  /** false: not offered in search (iD's `searchable: false`) */
  searchable?: false
  locationSet?: LocationSet
  /** iD leaves deprecated presets (those with a replacement) out of the area keys */
  replacement?: true
}

export type Preset = {
  id: string
  name: string
  geometry: Geometry[]
  tags: Tags
  addTags: Tags
  matchScore: number
  searchable: boolean
  locationSet?: LocationSet
}

/** Answers whether a location set holds at a point (iD's `locationSetsAt(loc).has(id)`). */
export type LocationMatcher = {
  matchesLocation(locationSet: LocationSet | undefined, loc: LonLat): boolean
}
