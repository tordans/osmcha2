import { loadLayersInViewport, type EliLayer } from '@osm-editor-kit/maplibre-editor-layer-index'
import type * as maplibre from 'maplibre-gl'
import { useEffect, useState } from 'react'

const VIEWPORT_LAYER_FILTER = {
  excludeOverlays: true,
} as const

let onMoveEndCallback: (() => void) | undefined

/** Invoked from the changeset Map `onMoveEnd` — do not attach a second MapLibre listener. */
export function onViewportEditorLayersMoveEnd() {
  onMoveEndCallback?.()
}

export function useViewportEditorLayers(map: maplibre.Map | null, enabled: boolean) {
  const [layers, setLayers] = useState<EliLayer[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')

  useEffect(
    function bindViewportEditorLayers() {
      if (!enabled || !map) {
        onMoveEndCallback = undefined
        return
      }

      let generation = 0
      let timer: ReturnType<typeof setTimeout> | undefined

      const recompute = () => {
        generation = generation + 1
        const gen = generation
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

      onMoveEndCallback = onMoveEnd
      recompute()
      return function unbindViewportEditorLayers() {
        generation = generation + 1
        clearTimeout(timer)
        if (onMoveEndCallback === onMoveEnd) onMoveEndCallback = undefined
      }
    },
    [enabled, map],
  )

  return { layers, status, onMoveEnd: onViewportEditorLayersMoveEnd }
}
