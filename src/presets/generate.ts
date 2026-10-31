// Cuts the preset data that matching needs out of the id-tagging-schema (see `data/matching-presets.json`).
// `bun run generate-presets` writes the file; `generate.test.ts` fails when the committed file is not what
// this function makes of the installed `@openstreetmap/id-tagging-schema`, so bump the package and
// regenerate together.
//
// The schema's `presets.min.json` (about 55 KB gzip) has no names: they are in
// `translations/en.min.json` (about 86 KB gzip), together with all field texts. The matcher needs neither
// fields nor the other translations, so the cut file is about a quarter of that.
//
// Left out: presets that are disabled everywhere (`locationSet` excluding `Planet`: the schema's
// `@templates/*`, which carry no real tag and never match), and presets without a geometry.
import type { Geometry, LocationSet, PresetRecord, Tags } from './types.ts'

type SchemaPreset = {
  tags?: Tags
  addTags?: Tags
  geometry?: readonly string[]
  matchScore?: number
  searchable?: boolean
  locationSet?: LocationSet
  replacement?: string
}

const GEOMETRIES: ReadonlySet<string> = new Set(['point', 'vertex', 'line', 'area', 'relation'])

function isGeometry(value: string): value is Geometry {
  return GEOMETRIES.has(value)
}

type Translations = {
  en: { presets: { presets: Record<string, { name?: string } | undefined> } }
}

/** iD's `{other/preset}` reference to the name of another preset. */
function referenceOf(text: string) {
  return /^\{([^{}]+)\}$/.exec(text)?.[1]
}

/** The English name of a preset; a reference to another preset is followed (a cycle gives nothing). */
function nameOf(names: Translations['en']['presets']['presets'], id: string) {
  const seen = new Set<string>()
  let current: string | undefined = id
  while (current !== undefined && !seen.has(current)) {
    seen.add(current)
    const text: string | undefined = names[current]?.name
    if (text === undefined) return undefined
    const reference = referenceOf(text)
    if (reference === undefined) return text
    current = reference
  }
  return undefined
}

const PLANET = /^(planet|001|q2)$/i

function disabledEverywhere(locationSet: LocationSet | undefined) {
  return locationSet?.exclude?.some((code) => PLANET.test(code)) ?? false
}

export function buildMatchingData(
  presets: Record<string, SchemaPreset>,
  translations: Translations,
): PresetRecord[] {
  const names = translations.en.presets.presets
  const records: PresetRecord[] = []
  for (const [id, preset] of Object.entries(presets)) {
    const geometry = (preset.geometry ?? []).filter(isGeometry)
    if (geometry.length === 0 || disabledEverywhere(preset.locationSet)) continue
    const record: PresetRecord = {
      id,
      name: nameOf(names, id) ?? id,
      geometry,
      tags: preset.tags ?? {},
    }
    if (preset.addTags) record.addTags = preset.addTags
    if (preset.matchScore !== undefined) record.matchScore = preset.matchScore
    if (preset.searchable === false) record.searchable = false
    if (preset.locationSet) record.locationSet = preset.locationSet
    if (preset.replacement) record.replacement = true
    records.push(record)
  }
  return records
}
