import { Layer, Source } from 'react-map-gl/maplibre'
import {
  SPYGLASS_ATTRIBUTION,
  SPYGLASS_MAX_ZOOM,
  SPYGLASS_MIN_ZOOM,
  SPYGLASS_NODE_HIT_LAYER_ID,
  SPYGLASS_NODE_LAYER_ID,
  SPYGLASS_SOURCE_ID,
  SPYGLASS_TILES,
  SPYGLASS_WAY_HIT_LAYER_ID,
  SPYGLASS_WAY_LAYER_ID,
} from './spyglassOverlay.ts'

const SPYGLASS_PAINT_COLOR = 'rgba(0, 0, 0, 0.85)'
const SPYGLASS_HIT_LINE_WIDTH = 8
const SPYGLASS_HIT_NODE_RADIUS = 8

export function SpyglassOverlay({ beforeId }: { beforeId: string }) {
  return (
    <>
      <Source
        id={SPYGLASS_SOURCE_ID}
        type="vector"
        tiles={SPYGLASS_TILES}
        minzoom={SPYGLASS_MIN_ZOOM}
        maxzoom={SPYGLASS_MAX_ZOOM}
        attribution={SPYGLASS_ATTRIBUTION}
      />
      <Layer
        id={SPYGLASS_WAY_HIT_LAYER_ID}
        type="line"
        source={SPYGLASS_SOURCE_ID}
        source-layer="ways"
        beforeId={beforeId}
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
        }}
        paint={{
          'line-color': '#000',
          'line-width': SPYGLASS_HIT_LINE_WIDTH,
          'line-opacity': 0,
        }}
      />
      <Layer
        id={SPYGLASS_NODE_HIT_LAYER_ID}
        type="circle"
        source={SPYGLASS_SOURCE_ID}
        source-layer="nodes"
        beforeId={beforeId}
        paint={{
          'circle-color': '#000',
          'circle-radius': SPYGLASS_HIT_NODE_RADIUS,
          'circle-opacity': 0,
        }}
      />
      <Layer
        id={SPYGLASS_WAY_LAYER_ID}
        type="line"
        source={SPYGLASS_SOURCE_ID}
        source-layer="ways"
        beforeId={beforeId}
        paint={{
          'line-color': SPYGLASS_PAINT_COLOR,
          'line-width': 0.75,
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
    </>
  )
}
