import type { Map } from 'maplibre-gl'
import { parseMapParam, type MapParam } from '../routing/mapParam.ts'
import type { LngLatBoundsTuple } from './changesetViewBounds.ts'

export type ChangesetCameraIntent = { type: 'restore'; camera: MapParam } | { type: 'fit' }

const MIN_PADDING_PX = 16
const MAX_PADDING_PX = 80
const MAX_FIT_ZOOM = 18

/** Missing `?map=` means fit this changeset; a parsed value is an explicit viewport. */
export function changesetCameraIntent(mapSearch: string | undefined): ChangesetCameraIntent {
  const camera = parseMapParam(mapSearch ?? '')
  return camera ? { type: 'restore', camera } : { type: 'fit' }
}

/** Padding that always leaves a usable viewport; `200px` overflows typical review panes. */
export function changesetFitPadding(width: number, height: number): number | null {
  const minSide = Math.min(width, height)
  if (minSide < 8) return null
  const desired = Math.floor(minSide * 0.12)
  const padding = Math.max(MIN_PADDING_PX, Math.min(MAX_PADDING_PX, desired))
  const maxPad = Math.max(0, Math.floor(minSide / 2) - 4)
  if (maxPad < 1) return 0
  return Math.min(padding, maxPad)
}

export function changesetFitOptions(
  width: number,
  height: number,
): { padding: number; maxZoom: number } | null {
  const padding = changesetFitPadding(width, height)
  if (padding == null) return null
  return { padding, maxZoom: MAX_FIT_ZOOM }
}

export function jumpMapToChangesetBounds(map: Map, bounds: LngLatBoundsTuple): boolean {
  const container = map.getContainer()
  const options = changesetFitOptions(container.clientWidth, container.clientHeight)
  if (!options) return false
  const camera = map.cameraForBounds(bounds, options)
  if (!camera) return false
  map.jumpTo(camera)
  return true
}
