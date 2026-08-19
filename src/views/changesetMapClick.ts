import type { Map, Point } from 'maplibre-gl'
import type { AdiffAction } from '../components/changeset/changesetElements.ts'

type PickableFeature = {
  id?: string | number
  properties?: { type?: string; id?: number } | null
}

export function rotateOverlappingFeatures<T extends PickableFeature>(
  features: T[],
  previousId: string | number | null,
): { feature: T; nextId: string | number } | null {
  const seen = new Set<string | number>()
  const deduplicated: T[] = []
  for (const feature of features) {
    if (feature.id == null || seen.has(feature.id)) continue
    seen.add(feature.id)
    deduplicated.push(feature)
  }
  if (deduplicated.length === 0) return null

  const sorted = [...deduplicated].sort((a, b) => Number(a.id) - Number(b.id))
  const selectedIndex = sorted.findIndex((feature) => feature.id === previousId)
  const nextIndex = (((selectedIndex + 1) % sorted.length) + sorted.length) % sorted.length
  const feature = sorted[nextIndex]
  if (feature.id == null) return null
  return { feature, nextId: feature.id }
}

export function pickChangesetActionFromClick(options: {
  map: Map
  point: Point
  interactiveLayerIds: string[]
  actions: AdiffAction[]
  previousFeatureId: string | number | null
}): { action: AdiffAction | null; nextFeatureId: string | number | null } {
  const { map, point, interactiveLayerIds, actions, previousFeatureId } = options
  const layerIds = interactiveLayerIds.filter((layerId) => Boolean(map.getLayer(layerId)))
  if (layerIds.length === 0) {
    return { action: null, nextFeatureId: null }
  }

  // Justified exception for hit slop + overlap carousel: react-map-gl `event.features`
  // is point-exact and has no overlap rotation. Not used for hover.
  const rendered = map.queryRenderedFeatures(
    [
      [point.x - 5, point.y - 5],
      [point.x + 5, point.y + 5],
    ],
    { layers: layerIds },
  )

  const picked = rotateOverlappingFeatures(rendered, previousFeatureId)
  if (!picked) {
    return { action: null, nextFeatureId: null }
  }

  const action =
    actions.find((item) => {
      const element = item.new ?? item.old
      return (
        element?.type === picked.feature.properties?.type &&
        element?.id === picked.feature.properties?.id
      )
    }) ?? null

  return { action, nextFeatureId: picked.nextId }
}
