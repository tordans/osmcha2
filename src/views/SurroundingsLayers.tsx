import { formatDistanceToNow } from 'date-fns'
import type { FilterSpecification } from 'maplibre-gl'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import { getPresetState, requestPresetMatcher, subscribePresets } from '../presets/presetStore.ts'
import { useSurroundingsBoxes } from '../query/hooks/useSurroundings.ts'
import {
  boxLabelPoints,
  boxOutlines,
  isSurroundingsArea,
  oldestTimestampInView,
} from './surroundingsBoxes.ts'
import { surroundingsLabelImage } from './surroundingsLabelImage.ts'
import {
  SURROUNDINGS_LINE_HIT_LAYER_ID,
  SURROUNDINGS_NODE_HIT_LAYER_ID,
  SURROUNDINGS_SOURCE_ID,
} from './surroundingsLayerIds.ts'
import { useMapView } from './useMapView.ts'

// Light: the changeset view dims every background to half its brightness.
const LINE_COLOR = '#fff'
const PAINT_COLOR = 'rgba(255, 255, 255, 0.8)'
const HIT_LINE_WIDTH = 8
const HIT_NODE_RADIUS = 8
const IS_POINT: FilterSpecification = ['==', ['geometry-type'], 'Point']
const IS_NOT_POINT: FilterSpecification = ['!=', ['geometry-type'], 'Point']
const IS_AREA: FilterSpecification = ['==', ['get', 'area'], true]
const IS_LINE: FilterSpecification = ['all', IS_NOT_POINT, ['==', ['get', 'area'], false]]
/** Dotted, both: thinner on areas, which have the band to tell them apart. */
const DOTS = [1, 2]
/** A band along the inside edge of areas, as MAID draws them. */
const AREA_BAND_PX = 5
const AREA_BAND_OPACITY = 0.2
const LABEL_IMAGE_ID = 'surroundings-age-label'
const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://github.com/woodpeck/postpass">Postpass</a>'

/** The loaded OSM objects, thin like the Spyglass overlay, and the frame around them. */
export function SurroundingsLayers({ beforeId }: { beforeId: string }) {
  const { current: map } = useMap()
  const view = useMapView(map?.getMap())
  const loaded = useSurroundingsBoxes()
  const { matcher } = useSyncExternalStore(subscribePresets, getPresetState)

  useEffect(function loadAreaRule() {
    requestPresetMatcher()
  }, [])

  const { objects, frame, labelPoints, boxes } = useMemo(() => {
    const boxes = Object.values(loaded)
    return {
      boxes,
      objects: {
        type: 'FeatureCollection',
        features: boxes.flatMap((box) =>
          box.features.map((feature) => ({
            ...feature,
            properties: {
              ...feature.properties,
              area: isSurroundingsArea(feature.properties ?? {}, matcher?.isArea),
            },
          })),
        ),
      } satisfies GeoJSON.FeatureCollection,
      frame: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'MultiLineString', coordinates: boxOutlines(boxes) },
      } satisfies GeoJSON.Feature,
      labelPoints: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'MultiPoint', coordinates: boxLabelPoints(boxes) },
      } satisfies GeoJSON.Feature,
    }
  }, [loaded, matcher])

  const oldest = view ? oldestTimestampInView(boxes, view) : null
  const ageText = oldest ? `OSM data ${formatDistanceToNow(new Date(oldest))} old` : null

  // Our styles have no glyphs, so the label is an image for the map to place on the frame. A new
  // style forgets it and asks again.
  useEffect(
    function keepAgeLabelImage() {
      const target = map?.getMap()
      if (!target || !ageText) return
      const { image, pixelRatio } = surroundingsLabelImage(ageText)
      function addLabelImage() {
        if (target?.hasImage(LABEL_IMAGE_ID)) target.removeImage(LABEL_IMAGE_ID)
        target?.addImage(LABEL_IMAGE_ID, image, { pixelRatio })
      }
      function onImageMissing({ id }: { id: string }) {
        if (id === LABEL_IMAGE_ID) addLabelImage()
      }
      addLabelImage()
      target.on('styleimagemissing', onImageMissing)
      return function stopKeepingAgeLabelImage() {
        target.off('styleimagemissing', onImageMissing)
      }
    },
    [map, ageText],
  )

  if (boxes.length === 0) return null

  return (
    <>
      <Source id={SURROUNDINGS_SOURCE_ID} type="geojson" data={objects} attribution={ATTRIBUTION} />
      <Layer
        id={SURROUNDINGS_LINE_HIT_LAYER_ID}
        type="line"
        source={SURROUNDINGS_SOURCE_ID}
        filter={IS_NOT_POINT}
        beforeId={beforeId}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': '#000', 'line-width': HIT_LINE_WIDTH, 'line-opacity': 0 }}
      />
      <Layer
        id={SURROUNDINGS_NODE_HIT_LAYER_ID}
        type="circle"
        source={SURROUNDINGS_SOURCE_ID}
        filter={IS_POINT}
        beforeId={beforeId}
        paint={{ 'circle-color': '#000', 'circle-radius': HIT_NODE_RADIUS, 'circle-opacity': 0 }}
      />
      <Layer
        id="surroundings-area-band"
        type="line"
        source={SURROUNDINGS_SOURCE_ID}
        filter={IS_AREA}
        beforeId={beforeId}
        layout={{ 'line-join': 'miter', 'line-miter-limit': 4 }}
        paint={{
          'line-color': LINE_COLOR,
          'line-opacity': AREA_BAND_OPACITY,
          'line-width': AREA_BAND_PX,
          'line-offset': AREA_BAND_PX / 2,
        }}
      />
      <Layer
        id="surroundings-areas"
        type="line"
        source={SURROUNDINGS_SOURCE_ID}
        filter={IS_AREA}
        beforeId={beforeId}
        paint={{ 'line-color': PAINT_COLOR, 'line-width': 0.75, 'line-dasharray': DOTS }}
      />
      <Layer
        id="surroundings-lines"
        type="line"
        source={SURROUNDINGS_SOURCE_ID}
        filter={IS_LINE}
        beforeId={beforeId}
        paint={{ 'line-color': PAINT_COLOR, 'line-width': 1.25, 'line-dasharray': DOTS }}
      />
      <Layer
        id="surroundings-nodes"
        type="circle"
        source={SURROUNDINGS_SOURCE_ID}
        filter={IS_POINT}
        beforeId={beforeId}
        paint={{ 'circle-color': PAINT_COLOR, 'circle-radius': 2 }}
      />
      <Source id="surroundings-frame" type="geojson" data={frame}>
        <Layer
          id="surroundings-frame-line"
          type="line"
          beforeId={beforeId}
          paint={{ 'line-color': PAINT_COLOR, 'line-width': 1, 'line-dasharray': [3, 3] }}
        />
      </Source>
      <Source id="surroundings-label" type="geojson" data={labelPoints}>
        {ageText ? (
          <Layer
            id="surroundings-label-symbols"
            type="symbol"
            beforeId={beforeId}
            layout={{
              'icon-image': LABEL_IMAGE_ID,
              'icon-anchor': 'bottom',
            }}
          />
        ) : null}
      </Source>
    </>
  )
}
