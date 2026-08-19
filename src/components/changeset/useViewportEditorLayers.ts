import { loadLayersInViewport, type EliLayer } from '@osm-editor-kit/maplibre-editor-layer-index'
import type * as maplibre from 'maplibre-gl'
import { useEffect, useState } from 'react'

const VIEWPORT_LAYER_FILTER = {
  excludeOverlays: true,
} as const

export function useViewportEditorLayers(map: maplibre.Map | null, enabled: boolean) {
  const [layers, setLayers] = useState<EliLayer[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')

  useEffect(
    function subscribeViewportEditorLayers() {
      if (!enabled || !map) {
        return
      }

      let generation = 0
      let timer: ReturnType<typeof setTimeout> | undefined

      const recompute = () => {
        const gen = ++generation
        setStatus('loading')
        void loadLayersInViewport(map.getBounds(), VIEWPORT_LAYER_FILTER).then((next) => {
          if (gen !== generation) return
          setLayers(next)
          setStatus('ready')
        })
      }

      const onMoveEnd = () => {
        clearTimeout(timer)
        timer = setTimeout(recompute, 150)
      }

      recompute()
      map.on('moveend', onMoveEnd)
      return function unsubscribeViewportEditorLayers() {
        generation += 1
        clearTimeout(timer)
        map.off('moveend', onMoveEnd)
      }
    },
    [enabled, map],
  )

  return { layers, status }
}
