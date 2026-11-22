import { describe, expect, test } from 'vitest'
import { serializeFiltersToObject } from '../../utils/filters.ts'
import { filtersWithoutAreaLimit } from './AreaLimitHint.tsx'

describe('filtersWithoutAreaLimit', () => {
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [13, 52],
        [14, 52],
        [14, 53],
        [13, 52],
      ],
    ],
  }

  test('drops area_lt and saves everything else unchanged', () => {
    const raw = {
      geometry: JSON.stringify(geometry),
      in_bbox: '13,52,14,53',
      area_lt: '2',
      tag_changes: 'highway=*,building=yes',
      date__gte: '2026-11-01',
    }
    const saved = serializeFiltersToObject(filtersWithoutAreaLimit(raw))
    expect(saved).toEqual({
      geometry: JSON.stringify(geometry),
      in_bbox: '13,52,14,53',
      tag_changes: 'highway=*,building=yes',
      date__gte: '2026-11-01',
    })
  })

  test('keeps a geometry the server returns as an object', () => {
    const saved = serializeFiltersToObject(filtersWithoutAreaLimit({ geometry, area_lt: 3 }))
    expect(saved).toEqual({ geometry: JSON.stringify(geometry) })
  })
})
