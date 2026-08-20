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
import { Description, Label } from '../ui/fieldset.tsx'
import { Input } from '../ui/input.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'
import { Text } from '../ui/text.tsx'
import { areaLtBoundPolygon, parseAreaLt } from './areaLtBound.ts'
import { filterOptionLabel, type Filter } from './index.ts'
import { SearchCombobox, type SearchOption } from './search_combobox.tsx'

type QueryTypeOption = { value: string; label: string }

const queryTypeOptions: QueryTypeOption[] = [
  { value: 'q', label: 'Any' },
  { value: 'city', label: 'City' },
  { value: 'county', label: 'County' },
  { value: 'state', label: 'State' },
  { value: 'country', label: 'Country' },
]

const emptyFeatureCollection: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

type LocationSelectProps = {
  name: string
  value?: Filter
  placeholder?: string
  areaLt?: Filter
  areaLtDisplay: string
  areaLtDescription: string
  areaLtPlaceholder?: string
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

function ensureLocationLayers(map: maplibre.Map) {
  if (!map.getSource('feature')) {
    map.addSource('feature', { type: 'geojson', data: emptyFeatureCollection })
  }
  if (!map.getSource('area-lt-bound')) {
    map.addSource('area-lt-bound', { type: 'geojson', data: emptyFeatureCollection })
  }

  if (map.getLayer('area-lt-fill') === undefined) {
    map.addLayer({
      id: 'area-lt-fill',
      type: 'fill',
      source: 'area-lt-bound',
      paint: {
        'fill-color': '#d97706',
        'fill-opacity': 0.08,
      },
    })
  }

  if (map.getLayer('area-lt-line') === undefined) {
    map.addLayer({
      id: 'area-lt-line',
      type: 'line',
      source: 'area-lt-bound',
      paint: {
        'line-color': '#d97706',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    })
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
}

export function LocationSelect({
  name,
  value,
  placeholder,
  areaLt,
  areaLtDisplay,
  areaLtDescription,
  areaLtPlaceholder,
  onChange,
}: LocationSelectProps) {
  const [queryType, setQueryType] = useState('q')
  const [placeQuery, setPlaceQuery] = useState('')
  const [debouncedPlaceQuery, setDebouncedPlaceQuery] = useState('')
  const [activeMode, setActiveMode] = useState('render')

  const mapRef = useRef<maplibre.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const locationGeometry = geometryFromValue(value)
  const hasLocation = locationGeometry != null
  const areaLtNumber = parseAreaLt(areaLt?.[0]?.value)
  const areaLtInputValue =
    areaLt?.[0]?.value == null || areaLt[0].value === '' ? '' : filterOptionLabel(areaLt[0].value)

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

  function setSourceData(sourceId: string, data: GeoJSON.GeoJSON) {
    const map = mapRef.current
    if (!map) return
    ensureLocationLayers(map)
    ;(map.getSource(sourceId) as maplibre.GeoJSONSource).setData(data)
  }

  function updateMap(data: GeoJSON.Geometry | null, nextAreaLt: number | null = areaLtNumber) {
    const map = mapRef.current
    if (!map) return

    ensureLocationLayers(map)

    if (data) {
      setSourceData('feature', data as unknown as GeoJSON.GeoJSON)
    } else {
      setSourceData('feature', emptyFeatureCollection)
    }

    const bound =
      data && nextAreaLt != null ? areaLtBoundPolygon(data as GeoJSON.Geometry, nextAreaLt) : null

    if (bound) {
      setSourceData('area-lt-bound', bound)
      const bounds = bbox(bound)
      map.fitBounds(
        [bounds.slice(0, 2) as [number, number], bounds.slice(2, 4) as [number, number]],
        { padding: 28 },
      )
      return
    }

    setSourceData('area-lt-bound', emptyFeatureCollection)

    if (data) {
      const bounds = bbox(data as unknown as GeoJSON.Feature)
      map.fitBounds(
        [bounds.slice(0, 2) as [number, number], bounds.slice(2, 4) as [number, number]],
        { padding: 20 },
      )
    }
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
    updateMap(locationGeometry as GeoJSON.Geometry | null, areaLtNumber)
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
      updateMap(locationGeometry as GeoJSON.Geometry | null, areaLtNumber)
    },
    [value, areaLt, areaLtNumber, locationGeometry],
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
    draw?.clear()
    draw?.setMode('render')
    setActiveMode('render')
    updateMap(null, null)
    onChange('geometry', null)
    onChange('in_bbox', null)
  }

  const handleAreaLtChange = (next: string) => {
    if (!next) {
      onChange('area_lt')
      updateMap(locationGeometry as GeoJSON.Geometry | null, null)
      return
    }
    onChange('area_lt', [{ label: next, value: next }])
    updateMap(locationGeometry as GeoJSON.Geometry | null, parseAreaLt(next))
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

      <div className="relative">
        <div id="geometry-map" ref={containerRef} className="h-[300px] w-full touch-manipulation" />
        {hasLocation ? (
          <div className="pointer-events-none absolute top-2 right-2 rounded-md bg-white/90 px-2 py-1.5 text-xs text-zinc-700 shadow-sm ring-1 ring-zinc-950/10">
            <div className="flex items-center gap-2">
              <span className="inline-block size-2.5 rounded-sm bg-[#088]" />
              Your location
            </div>
            {areaLtNumber != null ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-sm border border-dashed border-amber-600 bg-amber-500/20" />
                Largest allowed changeset bbox
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {activeMode === 'rectangle' ? <Text>Click two corners to draw a bounding box.</Text> : null}
      {activeMode === 'polygon' ? (
        <Text>
          Click a series of points to draw a polygon; click back on the first point to finish.
        </Text>
      ) : null}

      <div className="space-y-2 border-t border-zinc-950/10 pt-3">
        <Label className="block">{areaLtDisplay}</Label>
        <div className="flex max-w-sm items-center gap-2">
          <Input
            name="area_lt"
            type="number"
            min={1}
            max={100}
            value={areaLtInputValue}
            placeholder={areaLtPlaceholder || areaLtDisplay}
            onChange={(event) => handleAreaLtChange(event.target.value)}
          />
          <span className="shrink-0 text-sm text-zinc-600">× your location area</span>
        </div>
        {!hasLocation ? (
          <Description>
            Draw or search for a location first. Without a location filter, maximum changeset size
            has no effect.
          </Description>
        ) : (
          <Description>{areaLtDescription}</Description>
        )}
      </div>
    </div>
  )
}
