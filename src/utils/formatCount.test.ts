import { describe, expect, test } from 'vitest'
import { formatCompactCount } from './formatCount.ts'

describe('formatCompactCount', () => {
  test('keeps values under 1,000 as a locale integer', () => {
    expect(formatCompactCount(0, 'en-US')).toBe('0')
    expect(formatCompactCount(812, 'en-US')).toBe('812')
    expect(formatCompactCount(999, 'de-DE')).toBe('999')
  })

  test('uses a one-decimal thousands suffix from 1,000', () => {
    expect(formatCompactCount(1000, 'en-US')).toBe('1 k')
    expect(formatCompactCount(1200, 'en-US')).toBe('1.2 k')
    expect(formatCompactCount(37814, 'en-US')).toBe('37.8 k')
    expect(formatCompactCount(37814, 'de-DE')).toBe('37,8 k')
  })

  test('uses millions from 1,000,000', () => {
    expect(formatCompactCount(1_200_000, 'en-US')).toBe('1.2 M')
  })
})
