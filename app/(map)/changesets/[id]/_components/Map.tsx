'use client'

import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useState } from 'react'
import { AttributionControl, MapProvider, Map as ReactMapGlMap } from 'react-map-gl/maplibre'
import { MapStyleControl } from './Map/MapStyleControl'
import { SourceLayerBounds } from './Map/SourceLayerBounds'
import { getChangesetBounds } from './Map/utils/getChangesetBounds'
import { mapStyles, type TMapStyle } from './Map/utils/mapStyles'

type Props = { osmChaChangeset: TOsmChaChangeset; osmChaRealChangeset: TOsmChaRealChangeset }

export const Map = ({ osmChaChangeset, osmChaRealChangeset }: Props) => {
  const bounds = getChangesetBounds(osmChaRealChangeset.metadata.bbox)
  const [mapStyle, setMapStyle] = useState<TMapStyle>('maptilerDataviz')

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
        mapStyle={mapStyles[mapStyle].url}
        attributionControl={false}
      >
        <SourceLayerBounds bounds={bounds} />
        <MapStyleControl
          useBackground={osmChaChangeset.properties.imagery_used}
          currentMapstyle={mapStyle}
          setMapStyle={setMapStyle}
        />
        <AttributionControl position="bottom-left" compact />
      </ReactMapGlMap>
    </MapProvider>
  )
}
