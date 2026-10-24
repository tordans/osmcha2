import { getLayers, type EliLocatorLayer } from '@osm-editor-kit/maplibre-editor-layer-index'
import { BUILTIN_BASEMAP_OPTIONS } from '../../map/basemapIds.ts'
import { toEliStyleId } from './basemapStyles.ts'

/**
 * Matches a changeset's `imagery_used` tag to the backgrounds the map can show.
 *
 * iD writes the names of the imagery it showed, joined by `;`: the Editor Layer Index (ELI) name of
 * each source (`Berlin/Geoportal DOP20RGB (2025)`), `Bing aerial imagery`, or `Custom (<url>)`.
 * Other editors write a free text or `Not reported`. Names can contain commas, so only `;` splits.
 *
 * Pure: no React and no map. The ELI package is only read for its (bundled, synchronous) layer list.
 */

const SKIP_TOKENS = new Set(['', 'not reported', 'none', 'unknown'])

const STREET_LEVEL_RE = /mapillary|kartaview|openstreetcam|mapilio|street[- ]?level/i

/** `Custom (https://…)` and `Custom` are what iD writes for a background it cannot name. */
const CUSTOM_RE = /^custom(?:\s|\(|$)/

export type ImageryLayerRef = Pick<EliLocatorLayer, 'id' | 'name' | 'overlay'> & {
  /** Layers that need an API key cannot be drawn here. */
  requiresKeys?: readonly string[]
}

/** Lower case, one space between words, one kind of quote: for comparing names, never for showing them. */
export function normalizeImageryName(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const SEASON_WORDS = /\b(?:sommer|summer|winter|fruehling|frühling|spring|herbst|autumn|fall)\b/g

/**
 * A name without what tells two captures of the same imagery apart: `(2025)`, `(2025) Sommer`,
 * `2014-2016`, `(Beta)`. `Berlin/Geoportal DOP20RGB (2022)` and `(2025) Sommer` share one key.
 */
export function imageryNameSeriesKey(name: string): string {
  return normalizeImageryName(name)
    .replace(/\((?:[^)]*\d[^)]*|beta)\)/g, ' ')
    .replace(/\b(?:19|20)\d{2}(?:\s*[-–]\s*(?:19|20)?\d{2})?\b/g, ' ')
    .replace(SEASON_WORDS, ' ')
    .replace(/\bbeta\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isUsableToken(token: string): boolean {
  const normalized = normalizeImageryName(token)
  if (SKIP_TOKENS.has(normalized)) return false
  if (CUSTOM_RE.test(normalized)) return false
  if (token.includes('://') || /\{[xyz]\}/i.test(token)) return false
  if (STREET_LEVEL_RE.test(token)) return false
  return true
}

/** The named imagery of a changeset, in the order the editor wrote it. Custom URLs and street-level photos are left out. */
export function parseImageryUsed(imageryUsed: string | null | undefined): string[] {
  if (!imageryUsed) return []
  return imageryUsed
    .split(';')
    .map((token) => token.trim())
    .filter(isUsableToken)
}

export function matchBuiltinStyleId(token: string): string | null {
  const normalized = normalizeImageryName(token)
  for (const option of BUILTIN_BASEMAP_OPTIONS) {
    if (
      normalized === option.id ||
      option.aliases.some((alias) => alias === normalized) ||
      normalizeImageryName(option.label) === normalized
    ) {
      return option.id
    }
  }
  return null
}

export function isDuplicateOfBuiltinLayer(layer: ImageryLayerRef): boolean {
  return matchBuiltinStyleId(layer.name) !== null || matchBuiltinStyleId(layer.id) !== null
}

type LayerIndex = {
  byName: Map<string, ImageryLayerRef[]>
  byId: Map<string, ImageryLayerRef>
  bySeries: Map<string, ImageryLayerRef[]>
}

const indexCache = new WeakMap<readonly ImageryLayerRef[], LayerIndex>()

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const bucket = map.get(key)
  if (bucket) bucket.push(value)
  else map.set(key, [value])
}

/** Looked up per token, and the list has some 1700 layers: built once per list. */
function indexLayers(layers: readonly ImageryLayerRef[]): LayerIndex {
  const cached = indexCache.get(layers)
  if (cached) return cached
  const index: LayerIndex = { byName: new Map(), byId: new Map(), bySeries: new Map() }
  for (const layer of layers) {
    if (layer.overlay || (layer.requiresKeys?.length ?? 0) > 0) continue
    push(index.byName, normalizeImageryName(layer.name), layer)
    index.byId.set(normalizeImageryName(layer.id), layer)
    const key = imageryNameSeriesKey(layer.name)
    if (key.length >= 6) push(index.bySeries, key, layer)
  }
  indexCache.set(layers, index)
  return index
}

export type ImageryUsedMatch = {
  /** Style id of the basemap: a builtin id or `eli:<layer id>`. */
  styleId: string
  /** The name to show for the layer. */
  label: string
  /** The `imagery_used` entry it came from. */
  token: string
}

export type ImageryUsedResolution = {
  /** The named entries of the tag (see {@link parseImageryUsed}). */
  tokens: string[]
  /** Layers with exactly the name (or id) of an entry, in the order of the entries. */
  matches: ImageryUsedMatch[]
  /**
   * Other captures of an entry that no layer is named after (`(2022)` is gone from the index, `(2025)` is
   * there). Not chosen for the person: a different date shows different imagery.
   */
  similar: ImageryUsedMatch[]
  /** Entries that no builtin or indexed layer matches. */
  unmatched: string[]
}

function matchToken(token: string, index: LayerIndex): Omit<ImageryUsedResolution, 'tokens'> {
  const normalized = normalizeImageryName(token)

  const builtin = matchBuiltinStyleId(token)
  if (builtin) {
    const option = BUILTIN_BASEMAP_OPTIONS.find((entry) => entry.id === builtin)
    return {
      matches: [{ styleId: builtin, label: option?.label ?? token, token }],
      similar: [],
      unmatched: [],
    }
  }

  const exact = index.byName.get(normalized) ?? [index.byId.get(normalized)].filter(isDefined)
  if (exact.length > 0) {
    const ordered = [...exact].sort((a, b) => a.id.localeCompare(b.id))
    return {
      matches: ordered.map((layer) => ({
        styleId: toEliStyleId(layer.id),
        label: layer.name,
        token,
      })),
      similar: [],
      unmatched: [],
    }
  }

  const key = imageryNameSeriesKey(token)
  const sameSeries = key.length >= 6 ? index.bySeries.get(key) : undefined
  if (sameSeries && sameSeries.length > 0) {
    return {
      matches: [],
      similar: sameSeries.map((layer) => ({
        styleId: toEliStyleId(layer.id),
        label: layer.name,
        token,
      })),
      unmatched: [],
    }
  }

  return { matches: [], similar: [], unmatched: [token] }
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

/**
 * Which backgrounds a changeset used. Entries that match nothing are tried again split at commas, because a
 * few editors write a plain comma list; index names like `Berlin/Geoportal Baumbestand, Alkis s/w` have
 * commas too, which is why `;` is the first split and the commas the second.
 */
export function resolveImageryUsed(
  imageryUsed: string | null | undefined,
  layers: readonly ImageryLayerRef[] = getLayers(),
): ImageryUsedResolution {
  const tokens = parseImageryUsed(imageryUsed)
  const index = indexLayers(layers)
  const result: ImageryUsedResolution = { tokens, matches: [], similar: [], unmatched: [] }
  const seenMatches = new Set<string>()
  const seenSimilar = new Set<string>()

  function add(into: ImageryUsedMatch[], seen: Set<string>, match: ImageryUsedMatch) {
    if (seen.has(match.styleId)) return
    seen.add(match.styleId)
    into.push(match)
  }

  function take(token: string): boolean {
    const found = matchToken(token, index)
    for (const match of found.matches) add(result.matches, seenMatches, match)
    for (const match of found.similar) add(result.similar, seenSimilar, match)
    return found.matches.length > 0 || found.similar.length > 0
  }

  for (const token of tokens) {
    if (take(token)) continue
    if (token.includes(',')) {
      const parts = token
        .split(',')
        .map((part) => part.trim())
        .filter(isUsableToken)
      const hits = parts.filter((part) => take(part))
      if (hits.length > 0) continue
    }
    result.unmatched.push(token)
  }

  // exact matches win over a series guess from another entry
  result.similar = result.similar.filter(
    (match) => !result.matches.some((exact) => exact.styleId === match.styleId),
  )
  return result
}

/** The first entry of the tag that names a background the map can show. */
export function matchImageryUsedSelection(
  imageryUsed: string | null | undefined,
  layers: readonly ImageryLayerRef[] = getLayers(),
): ImageryUsedMatch | null {
  return resolveImageryUsed(imageryUsed, layers).matches[0] ?? null
}

export function matchImageryUsedStyleId(
  imageryUsed: string | null | undefined,
  layers: readonly ImageryLayerRef[] = getLayers(),
): string | null {
  return matchImageryUsedSelection(imageryUsed, layers)?.styleId ?? null
}
