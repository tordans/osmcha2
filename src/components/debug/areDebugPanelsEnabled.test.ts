import { describe, expect, it } from 'vitest'
import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'

describe('areDebugPanelsEnabled', () => {
  it('is on in development and off in production', () => {
    expect(areDebugPanelsEnabled(true)).toBe(true)
    expect(areDebugPanelsEnabled(false)).toBe(false)
  })
})
