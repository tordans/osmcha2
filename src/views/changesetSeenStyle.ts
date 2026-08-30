import type { Map } from 'maplibre-gl'
import { objectRefKey } from '../notes/locateNotes.ts'
import { CHANGESET_OVERLAY_BG_LAYER_ID, CHANGESET_SOURCE_ID } from './changesetAdiffViewer.ts'
import type { ChangesetGeoJSON } from './changesetFeatureState.ts'

/** Zinc-400 — grayed-out map paint for objects marked seen. */
export const SEEN_MAP_HEX = '#a1a1aa'

export const SEEN_FILTER = {
  hex: SEEN_MAP_HEX,
  label: 'Seen',
  unseenLabel: 'Unseen',
} as const

const SEEN_DIM = 0.72
const SEEN: unknown[] = ['boolean', ['feature-state', 'seen'], false]

export function featureIsSeen(
  properties: { type?: string; id?: number } | null | undefined,
  seenMap: Record<string, string> | undefined,
): boolean {
  if (!seenMap || properties?.type == null || properties.id == null) return false
  return seenMap[objectRefKey(properties.type, properties.id)] != null
}

export function passesReviewFilter(seen: boolean, showSeen: boolean, showUnseen: boolean): boolean {
  return seen ? showSeen : showUnseen
}

export function changesetFeaturePassesReviewFilter(
  feature: { source?: string; properties?: { type?: string; id?: number } | null },
  seenMap: Record<string, string> | undefined,
  showSeen: boolean,
  showUnseen: boolean,
): boolean {
  if (feature.source != null && feature.source !== CHANGESET_SOURCE_ID) return true
  return passesReviewFilter(featureIsSeen(feature.properties, seenMap), showSeen, showUnseen)
}

export function syncSeenFeatureState(
  map: Map,
  geojson: ChangesetGeoJSON,
  seenMap: Record<string, string> | undefined,
) {
  if (!map.getSource(CHANGESET_SOURCE_ID)) return
  for (const feature of geojson.features) {
    if (feature.id == null) continue
    map.setFeatureState(
      { source: CHANGESET_SOURCE_ID, id: feature.id },
      { seen: featureIsSeen(feature.properties, seenMap) },
    )
  }
}

function isColorPaintKey(key: string) {
  return key.endsWith('-color') && key !== 'background-color'
}

function opacityPaintKey(
  layerType: string | undefined,
  paint: Record<string, unknown> | undefined,
): 'line-opacity' | 'circle-opacity' | null {
  if (layerType === 'line') return 'line-opacity'
  if (layerType === 'circle') return 'circle-opacity'
  if (paint != null && 'line-color' in paint) return 'line-opacity'
  if (paint != null && 'circle-color' in paint) return 'circle-opacity'
  return null
}

export function grayPaintIfSeen(value: unknown): unknown {
  return ['case', SEEN, SEEN_MAP_HEX, value]
}

export function reviewVisibilityPaint(
  value: unknown,
  showSeen: boolean,
  showUnseen: boolean,
  dimSeen: boolean,
): unknown {
  const base = value ?? 1
  const shownSeen = dimSeen ? ['*', base, SEEN_DIM] : base

  if (showSeen && showUnseen) {
    return dimSeen ? ['case', SEEN, shownSeen, base] : base
  }
  if (!showSeen && !showUnseen) return 0
  if (showSeen) return ['case', SEEN, shownSeen, 0]
  return ['case', SEEN, 0, base]
}

export function applySeenMapStyle<
  T extends { id: string; type?: string; paint?: Record<string, unknown> },
>(layers: T[], options: { showSeen: boolean; showUnseen: boolean; graySeen: boolean }): T[] {
  return layers.map((layer) => {
    if (layer.id === CHANGESET_OVERLAY_BG_LAYER_ID) return layer

    const paint: Record<string, unknown> = { ...layer.paint }
    if (options.graySeen) {
      for (const [key, value] of Object.entries(layer.paint ?? {})) {
        if (isColorPaintKey(key)) paint[key] = grayPaintIfSeen(value)
      }
    }

    const opacityKey = opacityPaintKey(layer.type, layer.paint)
    const needsVisibility = !options.showSeen || !options.showUnseen
    const needsDim = options.graySeen && options.showSeen
    if (opacityKey && (needsVisibility || needsDim)) {
      paint[opacityKey] = reviewVisibilityPaint(
        layer.paint?.[opacityKey],
        options.showSeen,
        options.showUnseen,
        options.graySeen,
      )
    }

    return { ...layer, paint }
  })
}
