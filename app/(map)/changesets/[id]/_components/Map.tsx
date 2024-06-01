'use client'

import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import 'maplibre-gl/dist/maplibre-gl.css'
import { AttributionControl, MapProvider, Map as ReactMapGlMap } from 'react-map-gl/maplibre'
import { SourceLayerBounds } from './Map/SourceLayerBounds'
import { getChangesetBounds } from './Map/utils/getChangesetBounds'

type Props = { osmChaChangeset: TOsmChaChangeset; osmChaRealChangeset: TOsmChaRealChangeset }

export const Map = ({ osmChaChangeset, osmChaRealChangeset }: Props) => {
  const bounds = getChangesetBounds(osmChaRealChangeset.metadata.bbox)
  return (
    <MapProvider>
      <ReactMapGlMap
        id="mainMap"
        initialViewState={{
          bounds: bounds,
          fitBoundsOptions: { padding: 200 },
        }}
        style={{ width: '100%', height: '100%' }}
        // https://cloud.maptiler.com/maps/dataviz/, Acccount tordans private
        mapStyle="https://api.maptiler.com/maps/dataviz/style.json?key=ur6Yh3ULc6QjatOYBgln"
        attributionControl={false}
      >
        <SourceLayerBounds bounds={bounds} />
        <AttributionControl position="bottom-left" compact />
      </ReactMapGlMap>
    </MapProvider>
  )
}
