import { featureCollection } from '@turf/turf'
import { Layer, Source } from 'react-map-gl/maplibre'
import { getChangesetBoundsPolygon } from './utils/getChangesetBbox'
import { getChangesetBounds } from './utils/getChangesetBounds'

type Props = { bounds: ReturnType<typeof getChangesetBounds> }

export const SourceLayerBounds = ({ bounds }: Props) => {
  const data = featureCollection([getChangesetBoundsPolygon(bounds)])
  return (
    <Source id="changeset_bbox" type="geojson" data={data}>
      <Layer
        id="changeset_bbox-line"
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
