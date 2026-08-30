import {
  CHANGESET_OVERLAY_BG_LAYER_ID,
  changesetInteractiveLayerIds,
} from './changesetAdiffViewer.ts'

export const SPYGLASS_MIN_ZOOM = 15
export const SPYGLASS_MAX_ZOOM = 18
/** Unique hovered objects shown in the inspect flyout; the rest are “+N more”. */
const INSPECT_FLYOUT_MAX_ITEMS = 20
/** Tag rows per object; the rest of that object’s tags are “+N more”. */
const INSPECT_FLYOUT_MAX_TAGS = 20
export const SPYGLASS_SOURCE_ID = 'spyglass'
export const SPYGLASS_WAY_LAYER_ID = 'spyglass-ways-line'
export const SPYGLASS_NODE_LAYER_ID = 'spyglass-nodes-circle'
export const SPYGLASS_WAY_HIT_LAYER_ID = 'spyglass-ways-hit'
export const SPYGLASS_NODE_HIT_LAYER_ID = 'spyglass-nodes-hit'
/** Hover-legend swatch; overlay paint stays thin black. */
export const SPYGLASS_SWATCH_CLASS = 'bg-zinc-800'
/** Transparent hit targets used for hover; the thin paint layers stay out of picking. */
export const SPYGLASS_LAYER_IDS: string[] = [SPYGLASS_WAY_HIT_LAYER_ID, SPYGLASS_NODE_HIT_LAYER_ID]
export const CHANGESET_NOOP_LAYER_IDS: string[] = [
  'changeset-way-unchanged',
  'changeset-node-unchanged',
]

export const SPYGLASS_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://spyglass.jochentopf.com/">Spyglass</a>'

/** Vite proxies `/spyglass`. MapLibre fetches in a worker, so the template must be absolute. */
export function spyglassTileUrls(isDev: boolean, origin: string): string[] {
  if (isDev) {
    const base = origin.replace(/\/$/, '')
    return [`${base}/spyglass/vector/osm/{z}/{x}/{y}.mvt`]
  }
  return ['https://spyglass.jochentopf.com/vector/osm/{z}/{x}/{y}.mvt']
}

export const SPYGLASS_TILES = spyglassTileUrls(
  import.meta.env.DEV,
  typeof window === 'undefined' ? '' : window.location.origin,
)

const NON_TAG_KEYS = new Set([
  'type',
  'id',
  'action',
  'side',
  'version',
  'timestamp',
  'uid',
  'user',
  'changeset',
  'visible',
  'lat',
  'lon',
  'nodes',
  'members',
  'relations',
  'num_tags',
  'tags_changed',
  'old_tags',
  'new_tags',
])

export type SpyglassOverlayState = 'off' | 'armed' | 'active'

export type InspectHoverItem = {
  kind: 'spyglass' | 'noop'
  type: string
  id: number | string
  tags: Array<[string, string]>
}

export type InspectHover = {
  items: InspectHoverItem[]
  extraCount: number
}

export type InspectableMapFeature = {
  id?: string | number
  source?: string
  sourceLayer?: string
  layer?: { id?: string }
  properties?: Record<string, unknown> | null
}

export function spyglassEnabledAtZoom(enabled: boolean, zoom: number): SpyglassOverlayState {
  if (!enabled) return 'off'
  return zoom >= SPYGLASS_MIN_ZOOM ? 'active' : 'armed'
}

export function changesetClickableLayerIds(layers: Array<{ id: string }>): string[] {
  return changesetInteractiveLayerIds(layers).filter((id) => !isNoopLayerId(id))
}

export function changesetInspectLayerIds(
  layers: Array<{ id: string }>,
  options: { overlayActive: boolean; showNoop: boolean },
): string[] {
  const ids = changesetClickableLayerIds(layers)
  if (!options.overlayActive) return ids
  if (options.showNoop) ids.push(...CHANGESET_NOOP_LAYER_IDS)
  ids.push(...SPYGLASS_LAYER_IDS)
  return ids
}

export function cursorForMapHover(
  features: Array<InspectableMapFeature> | undefined,
  options: { pinPlacement: boolean; overlayActive: boolean },
): 'crosshair' | 'pointer' | 'help' | 'default' {
  if (options.pinPlacement) return 'crosshair'
  const hits = features ?? []
  if (hits.some((feature) => isClickableMapFeature(feature))) return 'pointer'
  if (options.overlayActive && hits.some((feature) => isInspectMapFeature(feature))) return 'help'
  return 'default'
}

export function inspectTagsFromProperties(
  properties: Record<string, unknown> | null | undefined,
  options?: { skipMetadataKeys?: boolean },
): Array<[string, string]> {
  if (!properties) return []
  const nested = properties.tags
  if (isPlainObject(nested)) return tagEntries(nested, { skipMetadataKeys: false })
  return tagEntries(properties, { skipMetadataKeys: options?.skipMetadataKeys ?? true })
}

export function inspectFlyoutTags(
  tags: Array<[string, string]>,
  max = INSPECT_FLYOUT_MAX_TAGS,
): { tags: Array<[string, string]>; moreCount: number } {
  const visible = tags.slice(0, max)
  return {
    tags: visible,
    moreCount: tags.length - visible.length,
  }
}

export type ChangesetMapHover = { type: string; id: number }

/** First clickable changeset element under the cursor. Ignores spyglass / noop. */
export function changesetHoverFromFeatures(
  features: Array<InspectableMapFeature> | undefined,
): ChangesetMapHover | null {
  for (const feature of features ?? []) {
    if (!isClickableMapFeature(feature)) continue
    const type = feature.properties?.type
    const rawId = feature.properties?.id
    if (typeof type !== 'string' || type.length === 0) continue
    const id = typeof rawId === 'number' ? rawId : typeof rawId === 'string' ? Number(rawId) : NaN
    if (!Number.isInteger(id) || id <= 0) continue
    return { type, id }
  }
  return null
}

export function inspectHoverFromFeatures(
  features: Array<InspectableMapFeature> | undefined,
): InspectHover | null {
  const hits = features ?? []
  if (hits.some((feature) => isClickableMapFeature(feature))) return null

  const items: InspectHoverItem[] = []
  const indexByKey = new Map<string, number>()
  let extraCount = 0

  for (const feature of hits) {
    const next = parseInspectFeature(feature)
    if (!next) continue
    const key = `${next.type}/${String(next.id)}`
    const existingIndex = indexByKey.get(key)
    if (existingIndex != null) {
      if (existingIndex < 0) continue
      const existing = items[existingIndex]
      if (existing && next.tags.length > existing.tags.length) existing.tags = next.tags
      continue
    }
    if (items.length >= INSPECT_FLYOUT_MAX_ITEMS) {
      indexByKey.set(key, -1)
      extraCount += 1
      continue
    }
    indexByKey.set(key, items.length)
    items.push({ kind: next.kind, type: next.type, id: next.id, tags: next.tags })
  }

  if (items.length === 0) return null
  return { items, extraCount }
}

function isNoopLayerId(id: string | undefined): boolean {
  return id != null && CHANGESET_NOOP_LAYER_IDS.includes(id)
}

function isSpyglassLayerId(id: string | undefined): boolean {
  return id != null && SPYGLASS_LAYER_IDS.includes(id)
}

function isChangesetLayerId(id: string | undefined): boolean {
  return (
    id != null &&
    id.startsWith('changeset-') &&
    id !== CHANGESET_OVERLAY_BG_LAYER_ID &&
    !id.startsWith('changeset-emphasis-')
  )
}

function isChangesetNoopFeature(feature: InspectableMapFeature): boolean {
  if (isSpyglassLayerId(layerIdOf(feature))) return false
  if (isNoopLayerId(layerIdOf(feature))) return true
  return isChangesetLayerId(layerIdOf(feature)) && feature.properties?.action === 'noop'
}

function isInspectMapFeature(feature: InspectableMapFeature): boolean {
  return isSpyglassLayerId(layerIdOf(feature)) || isChangesetNoopFeature(feature)
}

export function isClickableMapFeature(feature: InspectableMapFeature): boolean {
  if (!isChangesetLayerId(layerIdOf(feature))) return false
  return !isChangesetNoopFeature(feature)
}

function layerIdOf(feature: InspectableMapFeature): string | undefined {
  return feature.layer?.id
}

function parseInspectFeature(feature: InspectableMapFeature): InspectHoverItem | null {
  const layerId = layerIdOf(feature)
  const tags = inspectTagsFromProperties(feature.properties, {
    skipMetadataKeys: !isSpyglassLayerId(layerId),
  })

  if (isSpyglassLayerId(layerId)) {
    const type = osmTypeFromSpyglassSourceLayer(feature.sourceLayer, layerId)
    if (type == null || feature.id == null) return null
    return { kind: 'spyglass', type, id: feature.id, tags }
  }

  if (isChangesetNoopFeature(feature)) {
    const type = feature.properties?.type
    const id = feature.properties?.id
    if (typeof type !== 'string' || type.length === 0 || id == null) return null
    if (typeof id !== 'string' && typeof id !== 'number') return null
    return { kind: 'noop', type, id, tags }
  }

  return null
}

function osmTypeFromSpyglassSourceLayer(
  sourceLayer: string | undefined,
  layerId: string | undefined,
): string | null {
  if (sourceLayer === 'nodes' || layerId === SPYGLASS_NODE_HIT_LAYER_ID) return 'node'
  if (sourceLayer === 'ways' || layerId === SPYGLASS_WAY_HIT_LAYER_ID) return 'way'
  return null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringifyTagValue(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return null
}

function tagEntries(
  record: Record<string, unknown>,
  options: { skipMetadataKeys: boolean },
): Array<[string, string]> {
  const tags: Array<[string, string]> = []
  for (const [key, raw] of Object.entries(record)) {
    if (key.startsWith('@')) continue
    if (options.skipMetadataKeys && (NON_TAG_KEYS.has(key) || key === 'tags')) continue
    const value = stringifyTagValue(raw)
    if (value == null) continue
    tags.push([key, value])
  }
  return tags
}
