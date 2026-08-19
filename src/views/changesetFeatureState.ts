import type { Map } from 'maplibre-gl'
import { CHANGESET_SOURCE_ID } from './changesetAdiffViewer.ts'

export type ChangesetGeoJSON = {
  features: Array<{
    id?: string | number
    properties?: { type?: string; id?: number } | null
  }>
}

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

export function clearSelectedFeatureState(map: Map, geojson: ChangesetGeoJSON) {
  for (const feature of geojson.features) {
    if (feature.id == null) continue
    map.setFeatureState({ source: CHANGESET_SOURCE_ID, id: feature.id }, { selected: false })
  }
}

export function setSelectedFeatureState(
  map: Map,
  geojson: ChangesetGeoJSON,
  type: string,
  id: number,
) {
  clearSelectedFeatureState(map, geojson)
  for (const featureId of getFeatureIdsForElement(geojson, type, id)) {
    map.setFeatureState({ source: CHANGESET_SOURCE_ID, id: featureId }, { selected: true })
  }
}

export function setHighlightedFeatureState(
  map: Map,
  geojson: ChangesetGeoJSON,
  type: string,
  id: number,
  highlighted: boolean,
) {
  for (const featureId of getFeatureIdsForElement(geojson, type, id)) {
    map.setFeatureState({ source: CHANGESET_SOURCE_ID, id: featureId }, { highlighted })
  }
}
