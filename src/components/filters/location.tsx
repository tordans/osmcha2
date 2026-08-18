import area from '@turf/area'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import simplify from '@turf/simplify'
import truncate from '@turf/truncate'
import clsx from 'clsx'
import maplibre from 'maplibre-gl'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawRenderMode,
} from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { useNominatimSearch } from '../../query/hooks/useNominatimSearch.ts'
import { Button } from '../ui/button.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'
import { Text } from '../ui/text.tsx'
import type { Filter } from './index.ts'
import { SearchCombobox, type SearchOption } from './search_combobox.tsx'

type QueryTypeOption = { value: string; label: string }

const queryTypeOptions: QueryTypeOption[] = [
  { value: 'q', label: 'Any' },
  { value: 'city', label: 'City' },
  { value: 'county', label: 'County' },
  { value: 'state', label: 'State' },
  { value: 'country', label: 'Country' },
]

type LocationSelectProps = {
  name: string
  value?: Filter
  placeholder?: string
  onChange: (name: string, value?: Filter | null) => void
}

function isOneCharInputAllowed(input: string) {
  try {
    return /\p{scx=Han}|\p{scx=Hangul}|\p{scx=Hiragana}|\p{scx=Katakana}/u.test(input)
  } catch {
    return true
  }
}

function geometryFromValue(value?: Filter) {
  if (!value || value.length === 0) return null
  const geometry = value[0]?.value
  if (geometry && typeof geometry === 'object') return geometry
  if (geometry && typeof geometry === 'string') {
    const bounds = geometry.split(',').map(Number)
    return bboxPolygon(bounds as [number, number, number, number]).geometry
  }
  return null
}

export function LocationSelect({ name, value, placeholder, onChange }: LocationSelectProps) {
  const [queryType, setQueryType] = useState('q')
  const [placeQuery, setPlaceQuery] = useState('')
  const [debouncedPlaceQuery, setDebouncedPlaceQuery] = useState('')
  const [activeMode, setActiveMode] = useState('render')

  const mapRef = useRef<maplibre.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedQueryType =
    queryTypeOptions.find((option) => option.value === queryType) ?? queryTypeOptions[0]
  const canSearchPlaces = Boolean(
    debouncedPlaceQuery &&
    (debouncedPlaceQuery.length >= 2 || isOneCharInputAllowed(debouncedPlaceQuery)),
  )
  const nominatimQuery = useNominatimSearch(debouncedPlaceQuery, queryType, canSearchPlaces)
  const placeOptions: SearchOption[] = canSearchPlaces
    ? (nominatimQuery.data ?? []).map((place) => ({
        label: place.display_name,
        value: place.geojson,
      }))
    : []

  function updateMap(data: GeoJSON.Geometry) {
    const map = mapRef.current
    if (!map) return

    if (map.getSource('feature')) {
      ;(map.getSource('feature') as maplibre.GeoJSONSource).setData(
        data as unknown as GeoJSON.GeoJSON,
      )
    } else {
      map.addSource('feature', { type: 'geojson', data: data as unknown as GeoJSON.GeoJSON })
    }

    if (map.getLayer('geometry') === undefined) {
      map.addLayer({
        id: 'geometry',
        type: 'fill',
        source: 'feature',
        paint: {
          'fill-color': '#088',
          'fill-opacity': 0.3,
        },
      })
    }

    const bounds = bbox(data as unknown as GeoJSON.Feature)
    map.fitBounds(
      [bounds.slice(0, 2) as [number, number], bounds.slice(2, 4) as [number, number]],
      { padding: 20 },
    )
  }

  const onDrawFinished = useEffectEvent((id: string | number) => {
    const draw = drawRef.current
    if (!draw) return
    const snapshot = draw.getSnapshot()
    const feature = snapshot.find((item) => item.id === id)
    if (!feature) return

    if (feature.geometry.type === 'Polygon') {
      if (draw.getMode() === 'rectangle') {
        const bounds = bbox(feature)
        const wsen = bounds.map((v) => v.toFixed(4)).join(',')
        onChange('geometry', null)
        onChange('in_bbox', [{ label: wsen, value: wsen }])
      } else {
        onChange('geometry', [{ label: feature.geometry, value: feature.geometry }])
        onChange('in_bbox', null)
      }
    }

    draw.setMode('render')
    setActiveMode('render')
    updateMap(feature.geometry)
  })

  const onMapStyleReady = useEffectEvent(() => {
    const geometry = geometryFromValue(value)
    if (geometry) updateMap(geometry as GeoJSON.Geometry)
  })

  useEffect(
    function debouncePlaceQuery() {
      const handle = window.setTimeout(function publishDebouncedPlaceQuery() {
        setDebouncedPlaceQuery(placeQuery)
      }, 500)
      return function cancelDebouncedPlaceQuery() {
        window.clearTimeout(handle)
      }
    },
    [placeQuery],
  )

  useEffect(function initializeLocationMap() {
    const container = containerRef.current
    if (!container) return

    const map = new maplibre.Map({
      container,
      style: '/positron.json',
    })

    map.setMaxPitch(0)
    map.dragRotate.disable()
    map.boxZoom.disable()
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [
        new TerraDrawRectangleMode(),
        new TerraDrawPolygonMode(),
        new TerraDrawRenderMode({ modeName: 'render', styles: {} }),
      ],
    })

    mapRef.current = map
    drawRef.current = draw

    map.on('load', () => {
      draw.start()
      draw.on('finish', onDrawFinished)
    })

    map.on('style.load', () => {
      map.setProjection({ type: 'globe' })
      onMapStyleReady()
    })

    return function removeLocationMap() {
      map.remove()
      mapRef.current = null
      drawRef.current = null
    }
  }, [])

  useEffect(
    function synchronizeLocationGeometryToMap() {
      const geometry = geometryFromValue(value)
      if (geometry) updateMap(geometry as GeoJSON.Geometry)
    },
    [value],
  )

  const handlePlaceSelect = (option: SearchOption) => {
    const draw = drawRef.current
    draw?.clear()

    const geometry = option.value as Parameters<typeof area>[0]
    const tolerance = area(geometry) / 10 ** 6 < 1000 ? 0.01 : 0.1
    const simplified = simplify(geometry, {
      tolerance,
      highQuality: true,
    })

    onChange('geometry', [{ label: simplified, value: simplified }])
    onChange('in_bbox', null)
    updateMap(truncate(simplified, { precision: 6, coordinates: 2 }) as GeoJSON.Geometry)
  }

  const handleModeChange = (mode: string) => {
    const draw = drawRef.current
    if (!draw) return
    draw.clear()
    draw.setMode(mode as 'rectangle' | 'polygon' | 'render')
    setActiveMode(mode)
  }

  const handleClear = () => {
    const draw = drawRef.current
    const map = mapRef.current
    draw?.clear()
    draw?.setMode('render')
    setActiveMode('render')
    if (map?.getSource('feature')) {
      ;(map.getSource('feature') as maplibre.GeoJSONSource).setData({
        type: 'Feature',
        geometry: null,
      } as unknown as GeoJSON.GeoJSON)
    }
    onChange('geometry', null)
    onChange('in_bbox', null)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
        <div className="sm:col-span-4">
          <Listbox<QueryTypeOption>
            value={selectedQueryType}
            aria-label="Place type"
            onChange={(option) => {
              if (option) setQueryType(option.value)
            }}
          >
            {queryTypeOptions.map((option) => (
              <ListboxOption key={option.value} value={option}>
                <ListboxLabel>{option.label}</ListboxLabel>
              </ListboxOption>
            ))}
          </Listbox>
        </div>
        <div className="sm:col-span-8">
          <SearchCombobox
            name={name}
            options={placeOptions}
            placeholder={placeholder}
            clientFilter={false}
            onQueryChange={setPlaceQuery}
            onSelect={handlePlaceSelect}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          outline
          className={clsx(
            'min-h-11 cursor-pointer touch-manipulation select-none',
            activeMode === 'rectangle' && 'bg-zinc-200',
          )}
          onClick={() => handleModeChange('rectangle')}
        >
          Box
        </Button>
        <Button
          type="button"
          outline
          className={clsx(
            'min-h-11 cursor-pointer touch-manipulation select-none',
            activeMode === 'polygon' && 'bg-zinc-200',
          )}
          onClick={() => handleModeChange('polygon')}
        >
          Polygon
        </Button>
        <Button
          type="button"
          outline
          className="min-h-11 cursor-pointer touch-manipulation select-none"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>

      <div id="geometry-map" ref={containerRef} className="h-[300px] w-full touch-manipulation" />

      {activeMode === 'rectangle' ? <Text>Click two corners to draw a bounding box.</Text> : null}
      {activeMode === 'polygon' ? (
        <Text>
          Click a series of points to draw a polygon; click back on the first point to finish.
        </Text>
      ) : null}
    </div>
  )
}
