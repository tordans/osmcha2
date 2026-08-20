import { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import { useMemo } from 'react'

export const CHANGESET_MAP_ID = 'mainMap'
export const CHANGESET_SOURCE_ID = 'changeset'
const CHANGESET_OVERLAY_BG_LAYER_ID = 'changeset-overlay-bg'

const OSM_ADIFF_ATTRIBUTION =
  'Map data from <a href=https://openstreetmap.org/copyright>OpenStreetMap</a>'

export type ChangesetAdiffViewer = {
  adiff: {
    actions: Array<{
      new?: { type?: string; id?: number }
      old?: { type?: string; id?: number }
    }>
    note?: string
  }
  geojson: GeoJSON.FeatureCollection
  options: Record<string, unknown>
  layers: () => Array<{ id: string }>
}

export function changesetInteractiveLayerIds(layers: Array<{ id: string }>): string[] {
  return layers.map((layer) => layer.id).filter((id) => id !== CHANGESET_OVERLAY_BG_LAYER_ID)
}

/** Background dim has no source; vis.gl injects `source` onto nested Layer children. */
export function splitChangesetLayers<T extends { id: string }>(
  layers: T[],
): {
  overlayBg: T | undefined
  featureLayers: T[]
} {
  return {
    overlayBg: layers.find((layer) => layer.id === CHANGESET_OVERLAY_BG_LAYER_ID),
    featureLayers: layers.filter((layer) => layer.id !== CHANGESET_OVERLAY_BG_LAYER_ID),
  }
}

/** Construct the viewer as a GeoJSON + layer-spec factory. Never call addTo/refresh. */
export function useChangesetAdiffViewer(
  adiff: object | null | undefined,
  showElements: string[],
  showActions: string[],
): ChangesetAdiffViewer | null {
  return useMemo(() => {
    if (!adiff) return null
    return new MapLibreAugmentedDiffViewer(
      { ...adiff, note: OSM_ADIFF_ATTRIBUTION },
      { showElements, showActions },
    ) as ChangesetAdiffViewer
  }, [adiff, showElements, showActions])
}
