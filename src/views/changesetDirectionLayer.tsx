import type { ExpressionSpecification, Map } from 'maplibre-gl'
import { useEffect, useMemo } from 'react'
import { Layer, type LayerProps, Source, useMap } from 'react-map-gl/maplibre'
import { useChangesetHover } from '../stores/changeset-hover-store.ts'
import { CHANGESET_SOURCE_ID } from './changesetAdiffViewer.ts'
import { SIDE_OFFSET_PX, type SideLineFeature, sideLineFeatures } from './sideDirections.ts'

/**
 * The drawing direction of the selected or hovered way: white arrows with a dark outline along the
 * line, on the selection's halo. OSM has no list of the tags for which a way's direction matters (oneway, incline,
 * natural=cliff, barrier=retaining_wall, kerbs, …), so every selected line shows it. Areas never
 * carry a direction, so they get none. As MAID draws its selected way.
 */
const CHANGESET_DIRECTION_LAYER_ID = 'changeset-direction-selected'
const ARROW_IMAGE_ID = 'changeset-direction-arrow'
const ARROW_SPACING_PX = 56

/** The new version of a way, or the old one of a deleted way: the line the reviewer judges. */
const CURRENT_SIDE: ExpressionSpecification = [
  'any',
  ['==', ['get', 'side'], 'new'],
  ['==', ['get', 'action'], 'delete'],
]

const CHANGESET_DIRECTION_LAYER: LayerProps = {
  id: CHANGESET_DIRECTION_LAYER_ID,
  type: 'symbol',
  source: CHANGESET_SOURCE_ID,
  filter: [
    'all',
    ['==', ['get', 'type'], 'way'],
    ['==', ['geometry-type'], 'LineString'],
    CURRENT_SIDE,
  ],
  layout: {
    'symbol-placement': 'line',
    'symbol-spacing': ARROW_SPACING_PX,
    'icon-image': ARROW_IMAGE_ID,
    'icon-rotation-alignment': 'map',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
  // Layout cannot read feature state; the arrows of every other line are there, but unseen.
  paint: {
    'icon-opacity': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      1,
      ['boolean', ['feature-state', 'highlighted'], false],
      1,
      0,
    ],
  },
}

/** iD's one-way arrow (svg/defs), 10 × 5 units, pointing along the way */
const ARROW_PATH = 'M 6,3 L 0,3 L 0,2 L 6,2 L 5,0 L 10,2.5 L 5,5 z'
const ARROW_UNIT_PX = 2
const PAD_PX = 1

function arrowImage() {
  const pixelRatio = window.devicePixelRatio || 1
  const width = 10 * ARROW_UNIT_PX + 2 * PAD_PX
  const height = 5 * ARROW_UNIT_PX + 2 * PAD_PX
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  context.canvas.width = Math.ceil(width * pixelRatio)
  context.canvas.height = Math.ceil(height * pixelRatio)
  context.setTransform(
    pixelRatio * ARROW_UNIT_PX,
    0,
    0,
    pixelRatio * ARROW_UNIT_PX,
    pixelRatio * PAD_PX,
    pixelRatio * PAD_PX,
  )
  const path = new Path2D(ARROW_PATH)
  context.fillStyle = '#fff'
  context.strokeStyle = '#18181b'
  context.lineWidth = 0.5
  context.lineJoin = 'round'
  context.stroke(path)
  context.fill(path)
  return {
    image: context.getImageData(0, 0, context.canvas.width, context.canvas.height),
    pixelRatio,
  }
}

function addArrowImage(map: Map) {
  if (map.hasImage(ARROW_IMAGE_ID)) return
  const { image, pixelRatio } = arrowImage()
  map.addImage(ARROW_IMAGE_ID, image, { pixelRatio })
}

/** Keeps the arrow image on the map; a new style forgets it and asks again. */
function useDirectionArrowImage() {
  const { current: mapRef } = useMap()
  useEffect(
    function keepDirectionArrowImage() {
      const map = mapRef?.getMap()
      if (!map) return
      function onImageMissing({ id }: { id: string }) {
        if (id === ARROW_IMAGE_ID && map) addArrowImage(map)
      }
      addArrowImage(map)
      map.on('styleimagemissing', onImageMissing)
      return function stopKeepingDirectionArrowImage() {
        map.off('styleimagemissing', onImageMissing)
      }
    },
    [mapRef],
  )
}

/** Inside the changeset Source, above the colored lines. */
export function SelectedWayDirection() {
  useDirectionArrowImage()
  return <Layer {...CHANGESET_DIRECTION_LAYER} />
}

const SIDE_SOURCE_ID = 'changeset-side-directions'
const SIDE_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'kind'],
  'cycleway',
  'hsl(199 89% 48%)',
  'hsl(240 5% 65%)',
]

const SIDE_LINE_LAYER: LayerProps = {
  id: 'changeset-side-direction-lines',
  type: 'line',
  source: SIDE_SOURCE_ID,
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': SIDE_COLOR,
    'line-width': 3,
    'line-offset': ['get', 'offset'],
    'line-opacity': 0.9,
  },
}

/** An icon offset rotates with a line-placed icon: `[0, y]` moves it to the line's right. */
const SIDE_ARROW_LAYER: LayerProps = {
  id: 'changeset-side-direction-arrows',
  type: 'symbol',
  source: SIDE_SOURCE_ID,
  filter: ['==', ['get', 'arrows'], true],
  layout: {
    'symbol-placement': 'line',
    'symbol-spacing': ARROW_SPACING_PX,
    'icon-image': ARROW_IMAGE_ID,
    'icon-rotation-alignment': 'map',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'icon-offset': [
      'match',
      ['get', 'offset'],
      SIDE_OFFSET_PX.cycleway,
      ['literal', [0, SIDE_OFFSET_PX.cycleway]],
      -SIDE_OFFSET_PX.cycleway,
      ['literal', [0, -SIDE_OFFSET_PX.cycleway]],
      SIDE_OFFSET_PX.sidewalk,
      ['literal', [0, SIDE_OFFSET_PX.sidewalk]],
      -SIDE_OFFSET_PX.sidewalk,
      ['literal', [0, -SIDE_OFFSET_PX.sidewalk]],
      ['literal', [0, 0]],
    ],
  },
}

type ChangesetFeature = {
  geometry?: { type?: string; coordinates?: unknown } | null
  properties?: {
    type?: string
    id?: number
    side?: string
    action?: string
    tags?: Record<string, string>
  } | null
}

/**
 * Helper lines beside the selected and the hovered way for lanes and paths tagged on its centre
 * line with a oneway (`cycleway:right:oneway`, `sidewalk:left:oneway`, …), with their direction.
 * Render inside `<Map>`, after the changeset Source.
 */
export function SideWayDirections({
  features,
  selectedWayId,
}: {
  features: readonly ChangesetFeature[]
  selectedWayId: number | undefined
}) {
  useDirectionArrowImage()
  // Read here, not in the map: hovering re-renders only this.
  const hover = useChangesetHover()
  const hoveredWayId = hover?.type === 'way' ? hover.id : undefined
  const data = useMemo(() => {
    const wanted = new Set([selectedWayId, hoveredWayId])
    const lines: SideLineFeature[] = features.flatMap((feature) => {
      const properties = feature.properties
      if (properties?.type !== 'way' || properties.id == null || !wanted.has(properties.id)) {
        return []
      }
      if (properties.side !== 'new' && properties.action !== 'delete') return []
      if (feature.geometry?.type !== 'LineString') return []
      const coordinates = feature.geometry.coordinates as Array<[number, number]>
      return sideLineFeatures(coordinates, properties.tags)
    })
    return { type: 'FeatureCollection' as const, features: lines }
  }, [features, selectedWayId, hoveredWayId])
  return (
    <Source id={SIDE_SOURCE_ID} type="geojson" data={data}>
      <Layer {...SIDE_LINE_LAYER} />
      <Layer {...SIDE_ARROW_LAYER} />
    </Source>
  )
}
