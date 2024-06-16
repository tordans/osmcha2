'use client'

import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import { TOsmChaRealChangesetGeojson } from '@app/(map)/_data/OsmChaRealChangesetGeojson.zod'
import { useHighlightedFeaturesActions } from '@app/(map)/_data/highlightedFeatures.zustand'
import { useSelectedFeaturesActions } from '@app/(map)/_data/selectedFeatures.zustand'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useState } from 'react'
import {
  AttributionControl,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  MapProvider,
  Map as ReactMapGlMap,
} from 'react-map-gl/maplibre'
import { MapDebugHelper } from './Map/MapDebugHelper/MapDebugHelper'
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
  const [cursor, setCursor] = useState<'default' | 'pointer'>('default')
  const { setSelectedFeatures } = useSelectedFeaturesActions()
  const { setHighlightedFeatures } = useHighlightedFeaturesActions()

  const interactiveLayerIds = Object.keys(layers([], [])).filter(
    (l) => l.startsWith('modified-') || l.startsWith('added-') || l.startsWith('deleted-'),
  )

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
        cursor={cursor}
        interactiveLayerIds={interactiveLayerIds}
        onClick={(e: MapLayerMouseEvent) => {
          const features = e.features as
            | (TOsmChaRealChangesetGeojson['features'][number] & MapGeoJSONFeature)[]
            | undefined
          if (features?.length) {
            setSelectedFeatures(features.map((f) => f.properties.id))
          }
        }}
        onMouseEnter={(e: MapLayerMouseEvent) => {
          const features = e.features as
            | (TOsmChaRealChangesetGeojson['features'][number] & MapGeoJSONFeature)[]
            | undefined
          if (features?.length) {
            setHighlightedFeatures(features.map((f) => f.properties.id))
          }
          setCursor('pointer')
        }}
        onMouseLeave={(e: MapLayerMouseEvent) => {
          setHighlightedFeatures(null)
          setCursor('default')
        }}
      >
        <SourceLayerBounds bounds={bounds} />
        <SourceLayerChanges osmChaRealChangesetGeojson={osmChaRealChangesetGeojson} />

        <AttributionControl position="bottom-left" compact />
        <MapStyleControl
          useBackground={osmChaChangeset.properties.imagery_used}
          currentMapstyle={mapStyle}
          setMapStyle={setMapStyle}
        />
        <MapDebugHelper />
      </ReactMapGlMap>
    </MapProvider>
  )
}
