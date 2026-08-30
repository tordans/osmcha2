import { describe, expect, test } from 'vitest'
import { changeRowDomId, scrollDeltaToReveal } from './scrollChildIntoScroller.ts'

describe('scrollDeltaToReveal', () => {
  test('is 0 when the child is fully inside the parent', () => {
    expect(scrollDeltaToReveal(100, 400, 150, 200)).toBe(0)
  })

  test('scrolls up when the child is above the parent', () => {
    expect(scrollDeltaToReveal(100, 400, 40, 80)).toBe(-68)
  })

  test('scrolls down when the child is below the parent', () => {
    expect(scrollDeltaToReveal(100, 400, 420, 480)).toBe(88)
  })
})

describe('changeRowDomId', () => {
  test('is stable for type/id', () => {
    expect(changeRowDomId('way', 123)).toBe('change-row-way-123')
  })
})
