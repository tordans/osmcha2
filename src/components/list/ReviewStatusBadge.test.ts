import { describe, expect, test } from 'vitest'
import { hasResolvedTag } from './ReviewStatusBadge.tsx'

describe('hasResolvedTag', () => {
  test('is true when tag id 9 is present', () => {
    expect(hasResolvedTag([{ id: 9, name: 'Resolved' }])).toBe(true)
  })

  test('is false when resolved is missing', () => {
    expect(hasResolvedTag([{ id: 1, name: 'intentional' }])).toBe(false)
    expect(hasResolvedTag()).toBe(false)
  })
})
