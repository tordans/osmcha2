import { describe, expect, test } from 'vitest'
import {
  DEFAULT_MAP_LAYERS,
  isDefaultMapLayers,
  parseLayersParam,
  reviewFilterOf,
  searchWithLayers,
  serializeLayersParam,
  setReviewFilter,
  toggleMapLayer,
} from './layersParam.ts'
import { routerSearch } from './routerSearch.ts'

describe('parseLayersParam', () => {
  test('omitted value is every changeset layer on, including spyglass, Unseen only', () => {
    expect(parseLayersParam(undefined)).toEqual(DEFAULT_MAP_LAYERS)
    expect(parseLayersParam(null)).toEqual(DEFAULT_MAP_LAYERS)
    expect(parseLayersParam(1)).toEqual(DEFAULT_MAP_LAYERS)
    expect(isDefaultMapLayers(parseLayersParam(undefined))).toBe(true)
    expect(DEFAULT_MAP_LAYERS.spyglass).toBe(true)
    expect(DEFAULT_MAP_LAYERS).toMatchObject({ showSeen: false, showUnseen: true })
  })

  test('empty string is nothing visible, but still Unseen-only review filter', () => {
    expect(parseLayersParam('')).toEqual({
      showElements: [],
      showActions: [],
      spyglass: false,
      showSeen: false,
      showUnseen: true,
    })
  })

  test('reads an explicit set, ignoring unknown tokens, Unseen only by default', () => {
    expect(parseLayersParam('way,spyglass,nope')).toEqual({
      showElements: ['way'],
      showActions: [],
      spyglass: true,
      showSeen: false,
      showUnseen: true,
    })
  })

  test('Seen-only via no-unseen; legacy both-on coerces to Unseen', () => {
    expect(parseLayersParam('no-seen')).toEqual(DEFAULT_MAP_LAYERS)
    expect(parseLayersParam('no-unseen')).toEqual({
      ...DEFAULT_MAP_LAYERS,
      showSeen: true,
      showUnseen: false,
    })
    expect(parseLayersParam('create,modify,no-seen')).toEqual({
      showElements: [],
      showActions: ['create', 'modify'],
      spyglass: false,
      showSeen: false,
      showUnseen: true,
    })
    expect(parseLayersParam('way,no-unseen')).toMatchObject({ showSeen: true, showUnseen: false })
    // Legacy URLs without review tokens showed both; radio is exclusive → Unseen.
    expect(parseLayersParam('way')).toMatchObject({ showSeen: false, showUnseen: true })
  })

  test('keeps commas readable in the query string', () => {
    expect(routerSearch.stringify({ layers: 'way,relation,spyglass' })).toBe(
      '?layers=way,relation,spyglass',
    )
  })
})

describe('serializeLayersParam', () => {
  test('omits the key at the default set', () => {
    expect(serializeLayersParam(DEFAULT_MAP_LAYERS)).toBeUndefined()
    expect(searchWithLayers({ page: 1, layers: 'spyglass' }, DEFAULT_MAP_LAYERS)).toEqual({
      page: 1,
    })
  })

  test('writes a stable token order when spyglass is off', () => {
    expect(
      serializeLayersParam({
        showElements: ['relation', 'node', 'way'],
        showActions: ['noop', 'create', 'delete', 'modify'],
        spyglass: false,
        showSeen: false,
        showUnseen: true,
      }),
    ).toBe('create,modify,delete,noop,node,way,relation')
  })

  test('writes an empty string when nothing is visible', () => {
    expect(
      serializeLayersParam({
        showElements: [],
        showActions: [],
        spyglass: false,
        showSeen: false,
        showUnseen: true,
      }),
    ).toBe('')
    expect(
      searchWithLayers(
        { page: 1 },
        { showElements: [], showActions: [], spyglass: false, showSeen: false, showUnseen: true },
      ),
    ).toEqual({ page: 1, layers: '' })
  })

  test('appends no-unseen when filtering to Seen only', () => {
    expect(serializeLayersParam({ ...DEFAULT_MAP_LAYERS, showSeen: true, showUnseen: false })).toBe(
      'no-unseen',
    )
    expect(
      serializeLayersParam({
        ...DEFAULT_MAP_LAYERS,
        spyglass: false,
        showSeen: true,
        showUnseen: false,
      }),
    ).toBe('create,modify,delete,noop,node,way,relation,no-unseen')
  })
})

describe('review filter', () => {
  test('reviewFilterOf maps exclusive visibility', () => {
    expect(reviewFilterOf(DEFAULT_MAP_LAYERS)).toBe('unseen')
    expect(reviewFilterOf({ ...DEFAULT_MAP_LAYERS, showSeen: true, showUnseen: false })).toBe(
      'seen',
    )
  })

  test('setReviewFilter is exclusive', () => {
    expect(setReviewFilter(DEFAULT_MAP_LAYERS, 'seen')).toEqual({
      ...DEFAULT_MAP_LAYERS,
      showSeen: true,
      showUnseen: false,
    })
    expect(setReviewFilter(DEFAULT_MAP_LAYERS, 'unseen')).toEqual(DEFAULT_MAP_LAYERS)
  })
})

describe('toggleMapLayer', () => {
  test('adds and removes spyglass without touching changeset layers', () => {
    const off = toggleMapLayer(DEFAULT_MAP_LAYERS, 'spyglass')
    expect(off).toEqual({ ...DEFAULT_MAP_LAYERS, spyglass: false })
    expect(toggleMapLayer(off, 'spyglass')).toEqual(DEFAULT_MAP_LAYERS)
  })

  test('hides a type or action', () => {
    expect(toggleMapLayer(DEFAULT_MAP_LAYERS, 'node').showElements).toEqual(['way', 'relation'])
    expect(toggleMapLayer(DEFAULT_MAP_LAYERS, 'noop').showActions).toEqual([
      'create',
      'modify',
      'delete',
    ])
  })

  test('seen and unseen tokens select the exclusive radio side', () => {
    expect(toggleMapLayer(DEFAULT_MAP_LAYERS, 'seen')).toEqual({
      ...DEFAULT_MAP_LAYERS,
      showSeen: true,
      showUnseen: false,
    })
    expect(toggleMapLayer(DEFAULT_MAP_LAYERS, 'unseen')).toEqual(DEFAULT_MAP_LAYERS)
    expect(
      toggleMapLayer({ ...DEFAULT_MAP_LAYERS, showSeen: true, showUnseen: false }, 'unseen'),
    ).toEqual(DEFAULT_MAP_LAYERS)
  })
})
