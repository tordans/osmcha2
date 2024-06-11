'use client'

import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { TOsmChaRealChangesetGeojson } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangesetGeojson.zod'
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
  osmChaRealChangeset: TOsmChaRealChangeset
  osmChaRealChangesetGeojson: TOsmChaRealChangesetGeojson
}

export const Map = ({
  osmChaChangeset,
  osmChaRealChangeset,
  osmChaRealChangesetGeojson,
}: Props) => {
  const bounds = getChangesetBounds(osmChaRealChangeset.metadata.bbox)
  const [mapStyle, setMapStyle] = useState<TMapStyle>('maptilerDataviz')

  return (
    <MapProvider>
      <ReactMapGlMap
        id="mainMap"
        initialViewState={{
          bounds,
          fitBoundsOptions: { padding: 100 },
        }}
        style={{ width: '100%', height: '100%' }}
        // https://cloud.maptiler.com/maps/dataviz/, Acccount tordans private
        mapStyle={mapStyles[mapStyle].url}
        attributionControl={false}
        onClick={(e: MapLayerMouseEvent) => console.log(e.features)}
        interactiveLayerIds={Object.keys(layers)}
      >
        <SourceLayerBounds bounds={bounds} />
        <SourceLayerChanges osmChaRealChangesetGeojson={osmChaRealChangesetGeojson} />
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
