import { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import { useMemo } from 'react'
import { remapAdiffActionLayers } from '../components/changeset/actionColors.ts'

export const CHANGESET_MAP_ID = 'mainMap'
export const CHANGESET_SOURCE_ID = 'changeset'
export const CHANGESET_OVERLAY_BG_LAYER_ID = 'changeset-overlay-bg'

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
  layers: () => Array<{ id: string; type?: string; paint?: Record<string, unknown> }>
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

/** Case/halo layers sit under the colored core; emphasis inserts between them. */
export function isChangesetCaseLayerId(id: string) {
  return id.endsWith('-bg') && id !== CHANGESET_OVERLAY_BG_LAYER_ID
}

export function splitChangesetFeatureLayers<T extends { id: string }>(layers: T[]) {
  return {
    caseLayers: layers.filter((layer) => isChangesetCaseLayerId(layer.id)),
    coreLayers: layers.filter((layer) => !isChangesetCaseLayerId(layer.id)),
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
    const viewer = new MapLibreAugmentedDiffViewer(
      { ...adiff, note: OSM_ADIFF_ATTRIBUTION },
      { showElements, showActions },
    ) as ChangesetAdiffViewer
    return {
      adiff: viewer.adiff,
      geojson: viewer.geojson,
      options: viewer.options,
      layers: () => remapAdiffActionLayers(viewer.layers()),
    }
  }, [adiff, showElements, showActions])
}
