import { describe, expect, it } from 'vitest'
import { dayYearsAgo, defaultPhotoDate, photoTypesOfKind } from './streetImageryLayerSettings.ts'

describe('photoTypesOfKind', () => {
  it('limits the layer to one kind, or shows both', () => {
    expect(photoTypesOfKind('flat')).toEqual(['flat'])
    expect(photoTypesOfKind('pano')).toEqual(['pano'])
    expect(photoTypesOfKind('all')).toBeUndefined()
  })
})

describe('default photo date', () => {
  it('starts two years before today and has no end', () => {
    expect(defaultPhotoDate(new Date('2026-10-29T08:00:00Z'))).toEqual({ from: '2024-10-29' })
  })

  it('keeps the calendar day across a leap day', () => {
    expect(dayYearsAgo(2, new Date('2026-03-01T00:00:00Z'))).toBe('2024-03-01')
    expect(dayYearsAgo(2, new Date('2028-02-29T12:00:00Z'))).toBe('2026-03-01')
  })
})
