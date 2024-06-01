'use client'

import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapProvider, Map as ReacMapGlMap } from 'react-map-gl/maplibre'
import { getMapBounds } from '../_utils/getMapBounds'

type Props = { osmChaChangeset: TOsmChaChangeset; osmChaRealChangeset: TOsmChaRealChangeset }

export const Map = ({ osmChaChangeset, osmChaRealChangeset }: Props) => {
  return (
    <MapProvider>
      <ReacMapGlMap
        id="mainMap"
        initialViewState={{
          bounds: getMapBounds(osmChaRealChangeset.metadata.bbox),
          fitBoundsOptions: { padding: 200 },
        }}
        style={{ width: '100%', height: '100%' }}
        // https://cloud.maptiler.com/maps/dataviz/, Acccount tordans private
        mapStyle="https://api.maptiler.com/maps/dataviz/style.json?key=ur6Yh3ULc6QjatOYBgln"
        // attributionControl={false}
      />
      {/* <AttributionControl position="bottom-left" /> */}
    </MapProvider>
  )
}
