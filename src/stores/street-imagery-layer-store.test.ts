import { beforeEach, describe, expect, it } from 'vitest'
import {
  getStreetImageryLayerActions,
  getStreetImageryLayerState,
  parsePersistedStreetImageryLayer,
} from './street-imagery-layer-store.ts'

beforeEach(() => {
  const actions = getStreetImageryLayerActions()
  actions.setProviderOn('mapillary', false)
  actions.setProviderOn('panoramax', false)
  actions.setPhotoKind('all')
  actions.setDate(null)
})

describe('street imagery layer store', () => {
  it('starts with both providers off and the default date', () => {
    expect(getStreetImageryLayerState()).toEqual({
      mapillary: false,
      panoramax: false,
      photoKind: 'all',
      date: null,
    })
  })

  it('switches one provider without touching the other', () => {
    getStreetImageryLayerActions().setProviderOn('panoramax', true)
    expect(getStreetImageryLayerState()).toMatchObject({ mapillary: false, panoramax: true })
  })

  it('keeps "all dates" apart from the default date', () => {
    getStreetImageryLayerActions().setDate({})
    expect(getStreetImageryLayerState().date).toEqual({})
    getStreetImageryLayerActions().setDate(null)
    expect(getStreetImageryLayerState().date).toBeNull()
  })
})

describe('parsePersistedStreetImageryLayer', () => {
  it('reads a stored value', () => {
    expect(
      parsePersistedStreetImageryLayer({
        mapillary: true,
        panoramax: false,
        photoKind: 'pano',
        date: { from: '2024-01-31', to: '2025-02-01' },
      }),
    ).toEqual({
      mapillary: true,
      panoramax: false,
      photoKind: 'pano',
      date: { from: '2024-01-31', to: '2025-02-01' },
    })
  })

  it('falls back field by field', () => {
    expect(
      parsePersistedStreetImageryLayer({
        mapillary: 'yes',
        panoramax: true,
        photoKind: 'sphere',
        date: { from: '2024-02-30', to: '2025-02-01' },
      }),
    ).toEqual({
      mapillary: false,
      panoramax: true,
      photoKind: 'all',
      date: { from: undefined, to: '2025-02-01' },
    })
  })

  it('never throws on junk', () => {
    for (const junk of [undefined, null, 'x', 7, []]) {
      expect(parsePersistedStreetImageryLayer(junk)).toEqual({
        mapillary: false,
        panoramax: false,
        photoKind: 'all',
        date: null,
      })
    }
  })
})
