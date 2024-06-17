import type { SourceSpecification } from 'maplibre-gl'
import { useState } from 'react'
import { useMap, type AnyLayer } from 'react-map-gl/maplibre'
import JsonView from 'react18-json-view'
import { showDebugMap } from './showDebugMap'

export type MapDebugHelperData = {
  styleModified: string
  styleId: string
  styleName: string
  ourLayers: AnyLayer[]
  ourUpdatedLayers: AnyLayer[]
  source: string
  zoom: number
}

export const showMapDebugHelper = showDebugMap('debug')

export const MapDebugHelper = () => {
  const { mainMap } = useMap()
  const [searchTerm, setSearchTerm] = useState<string>('')

  if (!showMapDebugHelper || !mainMap) return null

  // mainMap is not available on first render, so we need to catch the errors
  let cleanLayers: AnyLayer[] = []
  let cleanSources: [string, SourceSpecification][] = []
  try {
    const layers = mainMap.getStyle().layers
    cleanLayers = layers
      .filter(
        (layer) =>
          'source' in layer &&
          !layer.source.includes('maptiler') &&
          !layer.source.includes('openmaptiles'),
      )
      .filter((layer) => layer.id.includes(searchTerm))

    const sources = mainMap.getStyle().sources
    cleanSources = Object.entries(sources)
      .filter(([key, _]) => !key.includes('maptiler') && !key.includes('openmaptiles'))
      .filter(([key, _]) => key.includes(searchTerm))
  } catch (error) {
    // console.info('MapDebugHelper', error)
  }

  const zoom = mainMap.getZoom()

  mainMap.getMap().showTileBoundaries = true

  // console.log('MapDebugHelper', { layers, sources })

  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG_PANELS === 'false') return null

  return (
    <section className="border-xl absolute left-1 top-1 z-50 max-h-[98%] overflow-y-auto rounded bg-pink-300 p-1 text-xs shadow-xl print:hidden">
      <input onChange={(e) => setSearchTerm(e.currentTarget.value)} value={searchTerm} />

      <details>
        <summary className="cursor-pointer">Sources ({cleanSources.length})</summary>
        <JsonView src={cleanSources} />
      </details>
      <hr className="border-1 my-0.5 border-gray-600" />

      <details>
        <summary className="cursor-pointer">Layers ({cleanLayers.length})</summary>
        <JsonView src={cleanLayers} />
      </details>
      <hr className="border-1 my-0.5 border-gray-600" />

      <div>Zoom: {zoom}</div>
    </section>
  )
}
