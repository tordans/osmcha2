import { useEffect, useState } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import { useMapLoaded } from '../stores/map-loaded-store.ts'
import {
  SPYGLASS_ATTRIBUTION,
  SPYGLASS_MAX_ZOOM,
  SPYGLASS_MIN_ZOOM,
  SPYGLASS_NODE_LAYER_ID,
  SPYGLASS_SOURCE_ID,
  SPYGLASS_TILES,
  SPYGLASS_WAY_LAYER_ID,
} from './spyglassOverlay.ts'

const SPYGLASS_PAINT_COLOR = 'rgba(0, 0, 0, 0.85)'

export function SpyglassOverlay({ beforeId }: { beforeId: string }) {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const [targetReady, setTargetReady] = useState(false)

  useEffect(
    function subscribeSpyglassPlacement() {
      const map = mainMap?.getMap()
      if (!mapLoaded || !map) {
        return
      }

      const updatePlacement = () => {
        setTargetReady(Boolean(map.getLayer(beforeId)))
      }
      const frame = requestAnimationFrame(updatePlacement)
      map.on('styledata', updatePlacement)
      return function unsubscribeSpyglassPlacement() {
        cancelAnimationFrame(frame)
        map.off('styledata', updatePlacement)
      }
    },
    [mainMap, mapLoaded, beforeId],
  )

  if (!targetReady) return null

  return (
    <Source
      id={SPYGLASS_SOURCE_ID}
      type="vector"
      tiles={SPYGLASS_TILES}
      minzoom={SPYGLASS_MIN_ZOOM}
      maxzoom={SPYGLASS_MAX_ZOOM}
      attribution={SPYGLASS_ATTRIBUTION}
    >
      <Layer
        id={SPYGLASS_WAY_LAYER_ID}
        type="line"
        source={SPYGLASS_SOURCE_ID}
        source-layer="ways"
        beforeId={beforeId}
        paint={{
          'line-color': SPYGLASS_PAINT_COLOR,
          'line-width': 0.75,
          'line-opacity': 1,
        }}
      />
      <Layer
        id={SPYGLASS_NODE_LAYER_ID}
        type="circle"
        source={SPYGLASS_SOURCE_ID}
        source-layer="nodes"
        beforeId={beforeId}
        paint={{
          'circle-color': SPYGLASS_PAINT_COLOR,
          'circle-radius': 2,
        }}
      />
    </Source>
  )
}
