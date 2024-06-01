import { bboxPolygon, featureCollection } from '@turf/turf'
import { getChangesetBounds } from './getChangesetBounds'

export const getChangesetBbox = (bounds: ReturnType<typeof getChangesetBounds>) => {
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

  return featureCollection([bboxPolygon([left - padX, bottom - padY, right + padX, top + padY])])
}
