import { TOsmChaRealChangesetGeojson } from '@app/(map)/_data/OsmChaRealChangesetGeojson.zod'
import { Layer, Source } from 'react-map-gl/maplibre'
import { layers } from './SourceLayerChanges/layers.const'

type Props = { osmChaRealChangesetGeojson: TOsmChaRealChangesetGeojson | undefined }

export const SourceLayerChanges = ({ osmChaRealChangesetGeojson }: Props) => {
  if (!osmChaRealChangesetGeojson?.features) return null

  return (
    <Source id="changeset" type="geojson" data={osmChaRealChangesetGeojson}>
      {Object.entries(layers).map(([key, layer]) => {
        return <Layer key={key} id={key} {...(layer as any)} />
      })}
    </Source>
  )
}
