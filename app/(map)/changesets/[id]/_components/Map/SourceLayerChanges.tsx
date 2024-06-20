import { TOsmChaRealChangesetGeojson } from '@app/(map)/_data/OsmChaRealChangesetGeojson.zod'
import { useHighlightedFeaturesFeatures } from '@app/(map)/_data/highlightedFeatures.zustand'
import { useSelectedFeatures } from '@app/(map)/_data/selectedFeatures.nuqs'
import { Layer, Source } from 'react-map-gl/maplibre'
import { layers } from './SourceLayerChanges/layers.const'

type Props = { osmChaRealChangesetGeojson: TOsmChaRealChangesetGeojson | undefined }

export const SourceLayerChanges = ({ osmChaRealChangesetGeojson }: Props) => {
  const highlightedFeatures = useHighlightedFeaturesFeatures()
  const { selectedFeatures } = useSelectedFeatures()

  if (!osmChaRealChangesetGeojson?.features) return null

  const layersWithFilter = layers(selectedFeatures, highlightedFeatures)

  return (
    <Source id="changeset" type="geojson" data={osmChaRealChangesetGeojson}>
      {Object.entries(layersWithFilter).map(([key, layer]) => {
        return <Layer key={key} id={key} {...(layer as any)} />
      })}
    </Source>
  )
}
