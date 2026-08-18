import { XMarkIcon } from '@heroicons/react/16/solid'
import type { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import clsx from 'clsx'
import type * as maplibre from 'maplibre-gl'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '../../hooks/useAuth.ts'
import { useChangeset } from '../../query/hooks/useChangeset.ts'
import { useChangesetMap } from '../../query/hooks/useChangesetMap.ts'
import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'
import { JsonDump } from './JsonDump.tsx'

const BASEMAP_SOURCE_HINTS = ['bing', 'esri', 'osm-tiles', 'maptiler', 'openmaptiles']

export type DebugMapHandle = {
  map: maplibre.Map
  adiffViewer: MapLibreAugmentedDiffViewer
}

type Props = {
  changesetId: number | null
  selected: unknown
  mapRef?: { current: DebugMapHandle | null }
}

function parseFiltersParam(raw: string | null): unknown {
  if (raw == null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function snapshotMap(handle: DebugMapHandle | null) {
  if (!handle?.map) return undefined
  try {
    const style = handle.map.getStyle()
    const sources = Object.entries(style.sources ?? {}).filter(
      ([key]) => !BASEMAP_SOURCE_HINTS.some((hint) => key.includes(hint)),
    )
    const layers = (style.layers ?? []).filter((layer) => {
      const source = 'source' in layer ? String(layer.source) : ''
      return !BASEMAP_SOURCE_HINTS.some((hint) => source.includes(hint) || layer.id.includes(hint))
    })
    return {
      zoom: handle.map.getZoom(),
      center: handle.map.getCenter(),
      styleName: style.name,
      sources: Object.fromEntries(sources),
      layers,
      adiffActionCount: handle.adiffViewer?.adiff?.actions?.length,
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

function DebugDataHelperActive({ changesetId, selected, mapRef }: Props) {
  const [show, setShow] = useState(false)
  const [mapSnapshot, setMapSnapshot] = useState<unknown>(undefined)
  const changesetQuery = useChangeset(changesetId)
  const mapQuery = useChangesetMap(changesetId)
  const { token, user } = useAuth()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!show) return

    const map = mapRef?.current?.map
    const update = () => {
      setMapSnapshot(snapshotMap(mapRef?.current ?? null))
    }
    update()
    if (!map) return

    map.on('moveend', update)
    map.on('styledata', update)
    return () => {
      map.off('moveend', update)
      map.off('styledata', update)
    }
  }, [show, mapRef])

  const filters = parseFiltersParam(searchParams.get('filters'))
  const aoi = searchParams.get('aoi')
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
          <JsonDetails title="URL filters (?filters=)" data={filters} />
          <JsonDetails title="URL AOI (?aoi=)" data={aoi} />
          <JsonDetails title="Selected map feature" data={selected} />
          <JsonDetails title="Auth user" data={authDump} />
          <JsonDetails title="Map inspector" data={mapSnapshot} />
        </>
      )}
    </div>
  )
}
