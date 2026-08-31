import type { Map } from 'maplibre-gl'
import { CHANGESET_SOURCE_ID } from './changesetAdiffViewer.ts'

export type ChangesetGeoJSON = {
  features: Array<{
    id?: string | number
    properties?: { type?: string; id?: number } | null
  }>
}

/** Last highlighted feature ids — avoid clearing every feature on each hover. */
let highlightedFeatureIds: Array<string | number> = []
/** Last selected feature ids — same for selection. */
let selectedFeatureIds: Array<string | number> = []

export function getFeatureIdsForElement(
  geojson: ChangesetGeoJSON,
  type: string,
  id: number,
): Array<string | number> {
  return geojson.features
    .filter((feature) => feature.properties?.type === type && feature.properties?.id === id)
    .map((feature) => feature.id)
    .filter((featureId): featureId is string | number => featureId != null)
}

function setFeatureStates(
  map: Map,
  featureIds: Array<string | number>,
  state: Record<string, boolean>,
) {
  for (const featureId of featureIds) {
    map.setFeatureState({ source: CHANGESET_SOURCE_ID, id: featureId }, state)
  }
}

export function clearSelectedFeatureState(map: Map, _geojson?: ChangesetGeoJSON) {
  setFeatureStates(map, selectedFeatureIds, { selected: false })
  selectedFeatureIds = []
}

export function setSelectedFeatureState(
  map: Map,
  geojson: ChangesetGeoJSON,
  type: string,
  id: number,
) {
  const nextIds = getFeatureIdsForElement(geojson, type, id)
  const nextSet = new Set(nextIds)
  const clearIds = selectedFeatureIds.filter((featureId) => !nextSet.has(featureId))
  setFeatureStates(map, clearIds, { selected: false })
  setFeatureStates(map, nextIds, { selected: true })
  selectedFeatureIds = nextIds
}

export function syncHighlightedFeatureState(
  map: Map,
  geojson: ChangesetGeoJSON,
  hover: { type: string; id: number } | null,
) {
  const nextIds = hover ? getFeatureIdsForElement(geojson, hover.type, hover.id) : []
  const nextSet = new Set(nextIds)
  const clearIds = highlightedFeatureIds.filter((featureId) => !nextSet.has(featureId))
  setFeatureStates(map, clearIds, { highlighted: false })
  setFeatureStates(map, nextIds, { highlighted: true })
  highlightedFeatureIds = nextIds
}
