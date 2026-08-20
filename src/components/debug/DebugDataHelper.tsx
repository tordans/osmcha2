import { XMarkIcon } from '@heroicons/react/16/solid'
import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import type * as maplibre from 'maplibre-gl'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useAuth } from '../../hooks/useAuth.ts'
import { useChangeset } from '../../query/hooks/useChangeset.ts'
import { useChangesetMap } from '../../query/hooks/useChangesetMap.ts'
import { filtersFromSearch } from '../../routing/filterSearch.ts'
import { useMapLoaded } from '../../stores/map-loaded-store.ts'
import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'
import { JsonDump } from './JsonDump.tsx'

const BASEMAP_SOURCE_HINTS = ['bing', 'esri', 'osm-tiles', 'maptiler', 'openmaptiles']

type Props = {
  changesetId: number | null
  selected: unknown
}

function snapshotMap(map: maplibre.Map, adiffActionCount: number | undefined) {
  try {
    const style = map.getStyle()
    const sources = Object.entries(style.sources ?? {}).filter(
      ([key]) => !BASEMAP_SOURCE_HINTS.some((hint) => key.includes(hint)),
    )
    const layers = (style.layers ?? []).filter((layer) => {
      const source = 'source' in layer ? String(layer.source) : ''
      return !BASEMAP_SOURCE_HINTS.some((hint) => source.includes(hint) || layer.id.includes(hint))
    })
    return {
      zoom: map.getZoom(),
      center: map.getCenter(),
      styleName: style.name,
      sources: Object.fromEntries(sources),
      layers,
      adiffActionCount,
    }
  } catch {
    return undefined
  }
}

function JsonDetails({ title, data }: { title: string; data: unknown }) {
  const [open, setOpen] = useState(false)
  const hasData = data !== undefined && data !== null

  return (
    <details
      onToggle={(event) => {
        setOpen(event.currentTarget.open)
      }}
    >
      <summary className={clsx(hasData ? 'cursor-pointer hover:underline' : 'text-zinc-400')}>
        {title}
      </summary>
      {open ? <JsonDump data={data} /> : null}
    </details>
  )
}

export function DebugDataHelper(props: Props) {
  if (!areDebugPanelsEnabled()) return null
  return <DebugDataHelperActive {...props} />
}

const rootRouteApi = getRouteApi('__root__')

function DebugDataHelperActive({ changesetId, selected }: Props) {
  const [show, setShow] = useState(false)
  const [mapSnapshot, setMapSnapshot] = useState<unknown>(undefined)
  const changesetQuery = useChangeset(changesetId)
  const mapQuery = useChangesetMap(changesetId)
  const { token, user } = useAuth()
  const search = rootRouteApi.useSearch()
  const { aoi } = search
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const adiffActionCount = mapQuery.data?.adiff?.actions?.length

  useEffect(
    function subscribeToMapInspector() {
      if (!show || !mapLoaded) return
      const map = mainMap?.getMap()
      if (!map) return

      const update = () => {
        setMapSnapshot(snapshotMap(map, adiffActionCount))
      }
      update()
      map.on('moveend', update)
      map.on('styledata', update)
      return function unsubscribeFromMapInspector() {
        map.off('moveend', update)
        map.off('styledata', update)
      }
    },
    [show, mapLoaded, mainMap, adiffActionCount],
  )

  const filtersDump = filtersFromSearch(search)
  const aoiDump = aoi ?? null
  const authDump = {
    token: token ? '[redacted]' : null,
    user,
  }

  return (
    <div
      className={clsx(
        'fixed top-1 left-1/2 z-30 flex max-h-[calc(100svh_-_1rem)] max-w-prose -translate-x-1/2 flex-col overflow-y-auto border border-white/70 bg-pink-300 text-xs shadow-xl print:hidden',
        show ? 'rounded px-1 py-0.5' : 'rounded-full p-0.5',
      )}
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="relative flex size-5 items-center justify-center rounded-full bg-white/50 hover:bg-white"
          aria-label={show ? 'Hide debug data' : 'Show debug data'}
          aria-expanded={show}
        >
          <XMarkIcon className={clsx('size-3', show ? '' : 'rotate-45')} />
        </button>
      </div>
      {show && (
        <>
          <JsonDetails title="OSMCha Changeset" data={changesetQuery.data} />
          <JsonDetails
            title="Changeset map (metadata + adiff)"
            data={
              mapQuery.data
                ? { metadata: mapQuery.data.metadata, adiff: mapQuery.data.adiff }
                : undefined
            }
          />
          <JsonDetails title="URL filters" data={filtersDump} />
          <JsonDetails title="URL AOI (?aoi=)" data={aoiDump} />
          <JsonDetails title="Selected map feature" data={selected} />
          <JsonDetails title="Auth user" data={authDump} />
          <JsonDetails title="Map inspector" data={mapSnapshot} />
        </>
      )}
    </div>
  )
}
