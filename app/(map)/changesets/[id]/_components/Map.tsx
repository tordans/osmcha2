'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { MapProvider, Map as ReacMapGlMap } from 'react-map-gl/maplibre'

type Props = { changeset: any }

export const Map = ({ changeset }: Props) => {
  return (
    <MapProvider>
      <ReacMapGlMap
        id="mainMap"
        initialViewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 14,
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
