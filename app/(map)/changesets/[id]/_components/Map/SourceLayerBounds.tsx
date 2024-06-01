import { Layer, Source } from 'react-map-gl/maplibre'
import { getChangesetBbox } from './utils/getChangesetBbox'
import { getChangesetBounds } from './utils/getChangesetBounds'

type Props = { bounds: ReturnType<typeof getChangesetBounds> }

export const SourceLayerBounds = ({ bounds }: Props) => {
  return (
    <Source id="changeset_bbox" type="geojson" data={getChangesetBbox(bounds)}>
      <Layer
        id="changeset_bbox_line"
        type="line"
        paint={{
          'line-color': '#A58CF2',
          'line-opacity': 0.75,
          'line-width': 2,
        }}
      />
    </Source>
  )
}
