'use client'

import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import { TOsmChaRealChangesetGeojson } from '@app/(map)/_data/OsmChaRealChangesetGeojson.zod'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useState } from 'react'
import {
  AttributionControl,
  MapLayerMouseEvent,
  MapProvider,
  Map as ReactMapGlMap,
} from 'react-map-gl/maplibre'
import { MapStyleControl } from './Map/MapStyleControl'
import { SourceLayerBounds } from './Map/SourceLayerBounds'
import { SourceLayerChanges } from './Map/SourceLayerChanges'
import { layers } from './Map/SourceLayerChanges/layers.const'
import { getChangesetBounds } from './Map/utils/getChangesetBounds'
import { mapStyles, type TMapStyle } from './Map/utils/mapStyles'

type Props = {
  osmChaChangeset: TOsmChaChangeset
  osmChaRealChangesetGeojson: TOsmChaRealChangesetGeojson | undefined
}

export const Map = ({ osmChaChangeset, osmChaRealChangesetGeojson }: Props) => {
  const bounds = getChangesetBounds(osmChaChangeset.geometry)
  const [mapStyle, setMapStyle] = useState<TMapStyle>('maptilerDataviz')

  return (
    <MapProvider>
      <ReactMapGlMap
        id="mainMap" // used for useMap https://visgl.github.io/react-map-gl/docs/api-reference/use-map
        // Initial view
        initialViewState={{
          bounds,
          fitBoundsOptions: { padding: 100 },
        }}
        // Style
        // https://cloud.maptiler.com/maps/dataviz/, Acccount tordans private
        mapStyle={mapStyles[mapStyle].url}
        attributionControl={false} // We use <AttributionControl /> instead
        style={{ width: '100%', height: '100%' }}
        // Interactivity
        // TODO: Add proper interactivity between map and sidebar
        interactiveLayerIds={Object.keys(layers)}
        onClick={(e: MapLayerMouseEvent) => console.log(e.features)}
      >
        <SourceLayerBounds bounds={bounds} />
        <SourceLayerChanges osmChaRealChangesetGeojson={osmChaRealChangesetGeojson} />

        <AttributionControl position="bottom-left" compact />
        <MapStyleControl
          useBackground={osmChaChangeset.properties.imagery_used}
          currentMapstyle={mapStyle}
          setMapStyle={setMapStyle}
        />
      </ReactMapGlMap>
    </MapProvider>
  )
}
