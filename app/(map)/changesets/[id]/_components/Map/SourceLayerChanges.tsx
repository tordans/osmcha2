import { TOsmChaRealChangesetGeojson } from '@components/zod/OsmChaRealChangesetGeojson.zod'
import { Layer, Source } from 'react-map-gl/maplibre'
import { layers } from './SourceLayerChanges/layers.const'

type Props = { osmChaRealChangesetGeojson: TOsmChaRealChangesetGeojson }

export const SourceLayerChanges = ({ osmChaRealChangesetGeojson }: Props) => {
  return (
    <Source id="changeset" type="geojson" data={osmChaRealChangesetGeojson}>
      {Object.entries(layers).map(([key, layer]) => {
        return <Layer key={key} id={key} {...(layer as any)} />
      })}
    </Source>
  )
}
