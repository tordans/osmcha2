import { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import { useMemo } from 'react'
import { remapAdiffActionLayers } from '../components/changeset/actionColors.ts'
import {
  isNoopAction,
  type AdiffAction,
  type ParsedAdiff,
} from '../components/changeset/changesetElements.ts'
import {
  annotateNodeClickability,
  applyNodeClickabilityStyle,
  CHANGESET_NODE_VERTEX_LAYER_IDS,
} from './changesetNodeLayers.ts'

export const CHANGESET_MAP_ID = 'mainMap'
export const CHANGESET_SOURCE_ID = 'changeset'
export const CHANGESET_OVERLAY_BG_LAYER_ID = 'changeset-overlay-bg'

const OSM_ADIFF_ATTRIBUTION =
  'Map data from <a href=https://openstreetmap.org/copyright>OpenStreetMap</a>'

export type ChangesetAdiffViewer = {
  adiff: ParsedAdiff
  geojson: GeoJSON.FeatureCollection
  options: Record<string, unknown>
  layers: () => Array<{ id: string; type?: string; paint?: Record<string, unknown> }>
}

/** Untagged corner points of ways are drawn but never hit-tested. */
export function changesetInteractiveLayerIds(layers: Array<{ id: string }>): string[] {
  return layers
    .map((layer) => layer.id)
    .filter((id) => id !== CHANGESET_OVERLAY_BG_LAYER_ID)
    .filter((id) => !CHANGESET_NODE_VERTEX_LAYER_IDS.includes(id))
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
function isChangesetCaseLayerId(id: string) {
  return id.endsWith('-bg') && id !== CHANGESET_OVERLAY_BG_LAYER_ID
}

export function splitChangesetFeatureLayers<T extends { id: string }>(layers: T[]) {
  return {
    caseLayers: layers.filter((layer) => isChangesetCaseLayerId(layer.id)),
    coreLayers: layers.filter((layer) => !isChangesetCaseLayerId(layer.id)),
  }
}

/** Dashed: context around an edit, not an edit. */
function dashUnchangedLayers<T extends { id: string; paint?: Record<string, unknown> }>(
  layers: T[],
) {
  return layers.map((layer) =>
    layer.id === 'changeset-way-unchanged'
      ? { ...layer, paint: { ...layer.paint, 'line-dasharray': [2, 2] } }
      : layer,
  )
}

/**
 * The adiff lists a way as `modify` when one of its nodes changed, even with the way itself the same:
 * same version, tags and geometry. The viewer only treats relations like that as context; do the
 * same for the rest, so the map's Unchanged filter decides on all of them alike.
 */
export function unchangedModifiesAsContext(
  geojson: GeoJSON.FeatureCollection,
  actions: AdiffAction[],
): GeoJSON.FeatureCollection {
  const unchanged = new Set(
    actions
      .filter((action) => action.type === 'modify' && isNoopAction(action))
      .map((action) => `${action.new?.type}/${action.new?.id}`),
  )
  if (unchanged.size === 0) return geojson
  const isUnchanged = ({ properties }: GeoJSON.Feature) =>
    unchanged.has(`${properties?.type}/${properties?.id}`)
  return {
    ...geojson,
    features: geojson.features.flatMap((feature) => {
      if (!isUnchanged(feature)) return [feature]
      if (feature.properties?.side === 'old') return []
      return [
        { ...feature, properties: { ...feature.properties, action: 'noop', side: undefined } },
      ]
    }),
  }
}

/** Construct the viewer as a GeoJSON + layer-spec factory. Never call addTo/refresh. */
export function useChangesetAdiffViewer(
  adiff: ParsedAdiff | null | undefined,
  showElements: string[],
  showActions: string[],
): ChangesetAdiffViewer | null {
  return useMemo(() => {
    if (!adiff) return null
    const viewer = new MapLibreAugmentedDiffViewer(
      { ...adiff, note: OSM_ADIFF_ATTRIBUTION },
      { showElements, showActions },
    )
    return {
      adiff: viewer.adiff,
      geojson: annotateNodeClickability(
        unchangedModifiesAsContext(viewer.geojson, viewer.adiff.actions),
        viewer.adiff.actions,
      ),
      options: viewer.options,
      layers: () =>
        dashUnchangedLayers(applyNodeClickabilityStyle(remapAdiffActionLayers(viewer.layers()))),
    }
  }, [adiff, showElements, showActions])
}
