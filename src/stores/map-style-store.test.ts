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

  it('a changeset imagery shows but is not saved, and the next changeset reverts it', () => {
    getMapStyleActions().setStyle('esri')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    getMapStyleActions().applyChangesetStyle('eli:Bing')
    expect(getMapStyle()).toBe('eli:Bing')
    expect(setItem).toHaveBeenLastCalledWith('map-controls', expect.stringContaining('"esri"'))
    getMapStyleActions().revertChangesetStyle()
    expect(getMapStyle()).toBe('esri')
  })

  it("the reader's own pick ends the changeset imagery", () => {
    getMapStyleActions().applyChangesetStyle('eli:Bing')
    getMapStyleActions().setStyle('eli:Bing')
    getMapStyleActions().revertChangesetStyle()
    expect(getMapStyle()).toBe('eli:Bing')
  })
})
