import { bboxPolygon } from '@turf/turf'
import { getChangesetBounds } from './getChangesetBounds'

export const getChangesetBoundsPolygon = (bounds: ReturnType<typeof getChangesetBounds>) => {
  return bboxPolygon(bounds)
}
