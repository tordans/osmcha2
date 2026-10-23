import area from '@turf/area'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import simplify from '@turf/simplify'
import clsx from 'clsx'
import type { MapLibreEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../../utils/maplibreWorker.ts'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Layer, Map, MapProvider, Source, useMap } from 'react-map-gl/maplibre'
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
import { filterOptionLabel, type Filter } from './filterTypes.ts'
import {
  isSearchablePlaceQuery,
  millisecondsUntilPlaceSearchAllowed,
  shouldSearchPlaceOnEnter,
  shouldSearchPlaceOnInput,
} from './placeSearchTrigger.ts'
import { SearchCombobox, type SearchOption } from './search_combobox.tsx'

type QueryTypeOption = { value: string; label: string }

const LOCATION_MAP_ID = 'locationFilterMap'

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

function sourceData(data: GeoJSON.Geometry | GeoJSON.GeoJSON | null): GeoJSON.GeoJSON {
  if (!data) return emptyFeatureCollection
  return data as GeoJSON.GeoJSON
}

export function LocationSelect(props: LocationSelectProps) {
  return (
    <MapProvider>
      <LocationSelectInner {...props} />
    </MapProvider>
  )
}

function LocationSelectInner({
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
  // The place text last sent to Nominatim (trimmed). It only changes when a search is sent.
  const [searchedPlaceQuery, setSearchedPlaceQuery] = useState('')
  const lastSentPlaceQueryRef = useRef('')
  const lastSentPlaceAtRef = useRef<number | null>(null)
  const pendingPlaceQueryRef = useRef<string | null>(null)
  const pendingPlaceTimerRef = useRef<number | null>(null)
  const [activeMode, setActiveMode] = useState('render')
  const [mapLoaded, setMapLoaded] = useState(false)

  const drawRef = useRef<TerraDraw | null>(null)
  const { [LOCATION_MAP_ID]: locationMap } = useMap()

  const locationGeometry = geometryFromValue(value)
  const hasLocation = locationGeometry != null
  const areaLtNumber = parseAreaLt(areaLt?.[0]?.value)
  const featureData = sourceData(locationGeometry as GeoJSON.Geometry | null)
  const areaLtBound =
    locationGeometry && areaLtNumber != null
      ? areaLtBoundPolygon(locationGeometry as GeoJSON.Geometry, areaLtNumber)
      : null
  const boundData = areaLtBound ?? emptyFeatureCollection
  const areaLtInputValue =
    areaLt?.[0]?.value == null || areaLt[0].value === '' ? '' : filterOptionLabel(areaLt[0].value)

  const selectedQueryType =
    queryTypeOptions.find((option) => option.value === queryType) ?? queryTypeOptions[0]
  const canSearchPlaces = isSearchablePlaceQuery(searchedPlaceQuery)
  const nominatimQuery = useNominatimSearch(searchedPlaceQuery, queryType, canSearchPlaces)
  const placeOptions: SearchOption[] = canSearchPlaces
    ? (nominatimQuery.data ?? []).map((place) => ({
        label: place.display_name,
        value: place.geojson,
      }))
    : []

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
  })

  useEffect(function cancelPendingPlaceSearch() {
    return function clearPendingPlaceSearchTimer() {
      if (pendingPlaceTimerRef.current !== null) {
        window.clearTimeout(pendingPlaceTimerRef.current)
      }
    }
  }, [])

  useEffect(
    function startLocationTerraDraw() {
      if (!mapLoaded) return
      const map = locationMap?.getMap()
      if (!map) return

      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawRectangleMode(),
          new TerraDrawPolygonMode(),
          new TerraDrawRenderMode({ modeName: 'render', styles: {} }),
        ],
      })

      draw.start()
      draw.on('finish', onDrawFinished)
      drawRef.current = draw

      return function stopLocationTerraDraw() {
        draw.stop()
        drawRef.current = null
      }
    },
    [mapLoaded, locationMap],
  )

  useEffect(
    function fitMapToLocationGeometry() {
      const map = locationMap?.getMap()
      if (!map || !mapLoaded) return

      if (areaLtBound) {
        const bounds = bbox(areaLtBound)
        map.fitBounds(
          [bounds.slice(0, 2) as [number, number], bounds.slice(2, 4) as [number, number]],
          { padding: 28 },
        )
        return
      }

      if (locationGeometry) {
        const bounds = bbox(locationGeometry as unknown as GeoJSON.Feature)
        map.fitBounds(
          [bounds.slice(0, 2) as [number, number], bounds.slice(2, 4) as [number, number]],
          { padding: 20 },
        )
      }
    },
    [areaLtBound, locationGeometry, mapLoaded, locationMap],
  )

  function sendPlaceSearch(text: string) {
    const query = text.trim()
    lastSentPlaceQueryRef.current = query
    lastSentPlaceAtRef.current = Date.now()
    setSearchedPlaceQuery(query)
  }

  function flushPendingPlaceSearch() {
    pendingPlaceTimerRef.current = null
    const text = pendingPlaceQueryRef.current
    pendingPlaceQueryRef.current = null
    if (text !== null && text.trim() !== lastSentPlaceQueryRef.current) sendPlaceSearch(text)
  }

  // At most one Nominatim request per interval. A request that has to wait goes out
  // when the interval has passed, with the latest text.
  function requestPlaceSearch(text: string) {
    pendingPlaceQueryRef.current = text
    if (pendingPlaceTimerRef.current !== null) return

    const delay = millisecondsUntilPlaceSearchAllowed({
      lastSentAt: lastSentPlaceAtRef.current,
      now: Date.now(),
    })
    if (delay === 0) {
      pendingPlaceQueryRef.current = null
      sendPlaceSearch(text)
      return
    }
    pendingPlaceTimerRef.current = window.setTimeout(flushPendingPlaceSearch, delay)
  }

  function resetPlaceSearch() {
    if (pendingPlaceTimerRef.current !== null) window.clearTimeout(pendingPlaceTimerRef.current)
    pendingPlaceTimerRef.current = null
    pendingPlaceQueryRef.current = null
    lastSentPlaceQueryRef.current = ''
    setSearchedPlaceQuery('')
  }

  function handlePlaceQueryChange(input: string) {
    // Clearing the input drops the results, so retyping the same place searches again.
    if (!input.trim()) {
      resetPlaceSearch()
      return
    }
    if (shouldSearchPlaceOnInput(input, lastSentPlaceQueryRef.current)) requestPlaceSearch(input)
  }

  function handlePlaceEnter(input: string) {
    if (shouldSearchPlaceOnEnter(input, lastSentPlaceQueryRef.current)) requestPlaceSearch(input)
  }

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
    onChange('geometry', null)
    onChange('in_bbox', null)
  }

  const handleAreaLtChange = (next: string) => {
    if (!next) {
      onChange('area_lt')
      return
    }
    onChange('area_lt', [{ label: next, value: next }])
  }

  function handleLoad(event: MapLibreEvent) {
    const map = event.target
    map.setProjection({ type: 'globe' })
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    setMapLoaded(true)
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
            onQueryChange={handlePlaceQueryChange}
            onEnter={handlePlaceEnter}
            onSelect={handlePlaceSelect}
          />
        </div>
      </div>
      <Description>Search starts after each word, or press Enter.</Description>

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
        <div id="geometry-map" className="h-[300px] w-full touch-manipulation">
          <Map
            id={LOCATION_MAP_ID}
            mapStyle="/positron.json"
            maxPitch={0}
            dragRotate={false}
            pitchWithRotate={false}
            touchPitch={false}
            boxZoom={false}
            style={{ width: '100%', height: '100%' }}
            onLoad={handleLoad}
          >
            <Source id="feature" type="geojson" data={featureData}>
              <Layer
                id="geometry"
                type="fill"
                paint={{
                  'fill-color': '#088',
                  'fill-opacity': 0.3,
                }}
              />
            </Source>
            <Source id="area-lt-bound" type="geojson" data={boundData}>
              <Layer
                id="area-lt-fill"
                type="fill"
                paint={{
                  'fill-color': '#d97706',
                  'fill-opacity': 0.08,
                }}
              />
              <Layer
                id="area-lt-line"
                type="line"
                paint={{
                  'line-color': '#d97706',
                  'line-width': 2,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
          </Map>
        </div>
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
