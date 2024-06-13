import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import { bbox } from '@turf/bbox'
import maplibregl from 'maplibre-gl'

/** @desc This includes some buffer */
export const getChangesetBounds = (inputPolygon: TOsmChaChangeset['geometry']) => {
  const inputBbox = bbox(inputPolygon)
  const bounds = new maplibregl.LngLatBounds(
    [inputBbox[1], inputBbox[0]],
    [inputBbox[3], inputBbox[2]],
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
  return [left - padX, bottom - padY, right + padX, top + padY] as const satisfies Bbox
}
