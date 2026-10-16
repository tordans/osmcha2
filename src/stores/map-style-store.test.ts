import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BASEMAP_ID } from '../map/basemapIds.ts'
import { getMapStyle, getMapStyleActions } from './map-style-store.ts'

beforeEach(() => {
  getMapStyleActions().setStyle(DEFAULT_BASEMAP_ID)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('map style store', () => {
  it('does not rewrite localStorage when the style is unchanged', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    getMapStyleActions().setStyle(DEFAULT_BASEMAP_ID)

    expect(setItem).not.toHaveBeenCalled()
    expect(getMapStyle()).toBe(DEFAULT_BASEMAP_ID)
  })

  it('still writes localStorage when the style changes', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    getMapStyleActions().setStyle('esri')

    expect(setItem).toHaveBeenCalledTimes(1)
    expect(getMapStyle()).toBe('esri')
  })
})
