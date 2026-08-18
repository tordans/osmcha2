import { describe, expect, it } from 'vitest'
import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'

describe('areDebugPanelsEnabled', () => {
  it('follows import.meta.env.DEV when no override is set', () => {
    expect(areDebugPanelsEnabled({ DEV: true })).toBe(true)
    expect(areDebugPanelsEnabled({ DEV: false })).toBe(false)
  })

  it('forces the panels on or off via OSMCHA_ENABLE_DEBUG_PANELS', () => {
    expect(areDebugPanelsEnabled({ DEV: false, OSMCHA_ENABLE_DEBUG_PANELS: 'true' })).toBe(true)
    expect(areDebugPanelsEnabled({ DEV: true, OSMCHA_ENABLE_DEBUG_PANELS: 'false' })).toBe(false)
  })

  it('accepts VITE_OSMCHA_ENABLE_DEBUG_PANELS when OSMCHA_ is unset', () => {
    expect(areDebugPanelsEnabled({ DEV: false, VITE_OSMCHA_ENABLE_DEBUG_PANELS: 'true' })).toBe(
      true,
    )
    expect(areDebugPanelsEnabled({ DEV: true, VITE_OSMCHA_ENABLE_DEBUG_PANELS: 'false' })).toBe(
      false,
    )
  })

  it('prefers OSMCHA_ENABLE_DEBUG_PANELS over the VITE_ alias', () => {
    expect(
      areDebugPanelsEnabled({
        DEV: false,
        OSMCHA_ENABLE_DEBUG_PANELS: 'false',
        VITE_OSMCHA_ENABLE_DEBUG_PANELS: 'true',
      }),
    ).toBe(false)
  })
})
