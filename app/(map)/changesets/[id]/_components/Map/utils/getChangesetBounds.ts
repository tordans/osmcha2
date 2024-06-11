import { TOsmChaRealChangeset } from '@components/zod/OsmChaRealChangeset.zod'
import maplibregl from 'maplibre-gl'

/** @desc This includes some buffer */
export const getChangesetBounds = (bbox: TOsmChaRealChangeset['metadata']['bbox']) => {
  const bounds = new maplibregl.LngLatBounds(
    new maplibregl.LngLat(Number(bbox.left), Number(bbox.bottom)),
    new maplibregl.LngLat(Number(bbox.right), Number(bbox.top)),
  )

  const left = bounds.getWest()
  const right = bounds.getEast()
  const top = bounds.getNorth()
  const bottom = bounds.getSouth()

  let padX = 0
  let padY = 0
  if (!(left === -180 && right === 180 && top === 90 && bottom === -90)) {
    padX = Math.max((right - left) / 5, 0.0001)
    padY = Math.max((top - bottom) / 5, 0.0001)
  }
  type Bbox = [number, number, number, number]
  return [left - padX, bottom - padY, right + padX, top + padY] satisfies Bbox
}
