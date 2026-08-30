import {
  getImageryUsedValue,
  getLayers,
  type EliLocatorLayer,
} from '@osm-editor-kit/maplibre-editor-layer-index'
import { BUILTIN_BASEMAP_OPTIONS, toEliStyleId } from './basemapStyles.ts'

const SKIP_TOKENS = new Set(['', 'not reported', 'none', 'unknown', 'custom'])

const STREET_LEVEL_RE = /mapillary|kartaview|openstreetcam|mapilio|street[- ]?level/i

export type ImageryLayerRef = Pick<EliLocatorLayer, 'id' | 'name' | 'overlay'>

export function normalizeImageryName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function parseImageryUsed(imageryUsed: string | null | undefined): string[] {
  if (!imageryUsed) return []
  return imageryUsed
    .split(/[;,]/)
    .map((token) => token.trim())
    .filter((token) => {
      if (SKIP_TOKENS.has(normalizeImageryName(token))) return false
      if (token.includes('://')) return false
      if (STREET_LEVEL_RE.test(token)) return false
      return true
    })
}

export function matchBuiltinStyleId(token: string): string | null {
  const normalized = normalizeImageryName(token)
  for (const option of BUILTIN_BASEMAP_OPTIONS) {
    if (
      (option.aliases as readonly string[]).includes(normalized) ||
      normalizeImageryName(option.label) === normalized
    ) {
      return option.id
    }
  }
  return null
}

function looselyMatches(token: string, candidate: string): boolean {
  const t = normalizeImageryName(token)
  const n = normalizeImageryName(candidate)
  if (!t || !n) return false
  if (t === n) return true
  if (t.startsWith(`${n} `) || t.startsWith(`${n} (`)) return true
  return n.length >= 8 && n.startsWith(`${t} `)
}

function matchEliLayer(token: string, layers: readonly ImageryLayerRef[]): ImageryLayerRef | null {
  const exact = layers.find((layer) => {
    if (layer.overlay) return false
    const used = getImageryUsedValue({ id: layer.id, name: layer.name, urlTemplate: '' })
    return (
      normalizeImageryName(layer.id) === normalizeImageryName(token) ||
      normalizeImageryName(layer.name) === normalizeImageryName(token) ||
      normalizeImageryName(used) === normalizeImageryName(token)
    )
  })
  if (exact) return exact

  return (
    layers.find((layer) => {
      if (layer.overlay) return false
      const used = getImageryUsedValue({ id: layer.id, name: layer.name, urlTemplate: '' })
      return (
        looselyMatches(token, layer.name) ||
        looselyMatches(token, layer.id) ||
        looselyMatches(token, used)
      )
    }) ?? null
  )
}

export function isImageryUsedMatch(imageryUsed: string | null | undefined, name: string): boolean {
  const normalized = normalizeImageryName(name)
  return parseImageryUsed(imageryUsed).some(
    (token) =>
      normalizeImageryName(token) === normalized ||
      looselyMatches(token, name) ||
      looselyMatches(name, token),
  )
}

export function isDuplicateOfBuiltinLayer(layer: ImageryLayerRef): boolean {
  return matchBuiltinStyleId(layer.name) !== null || matchBuiltinStyleId(layer.id) !== null
}

export type ImageryUsedMatch = {
  styleId: string
  label: string
}

/** Every parseable `imagery_used` token that maps to a builtin or ELI basemap (deduped). */
export function matchAllImageryUsedSelections(
  imageryUsed: string | null | undefined,
  eliLayers: readonly ImageryLayerRef[] = getLayers(),
): ImageryUsedMatch[] {
  const seen = new Set<string>()
  const matches: ImageryUsedMatch[] = []

  for (const token of parseImageryUsed(imageryUsed)) {
    const builtin = matchBuiltinStyleId(token)
    if (builtin) {
      if (seen.has(builtin)) continue
      seen.add(builtin)
      const option = BUILTIN_BASEMAP_OPTIONS.find((entry) => entry.id === builtin)
      matches.push({ styleId: builtin, label: option?.label ?? token })
      continue
    }

    const eli = matchEliLayer(token, eliLayers)
    if (!eli) continue
    const styleId = toEliStyleId(eli.id)
    if (seen.has(styleId)) continue
    seen.add(styleId)
    matches.push({ styleId, label: eli.name })
  }

  return matches
}

/** First parseable `imagery_used` token that maps to a builtin or ELI basemap. */
export function matchImageryUsedSelection(
  imageryUsed: string | null | undefined,
  eliLayers: readonly ImageryLayerRef[] = getLayers(),
): ImageryUsedMatch | null {
  return matchAllImageryUsedSelections(imageryUsed, eliLayers)[0] ?? null
}

export function matchImageryUsedStyleId(
  imageryUsed: string | null | undefined,
  eliLayers: readonly ImageryLayerRef[] = getLayers(),
): string | null {
  return matchImageryUsedSelection(imageryUsed, eliLayers)?.styleId ?? null
}
