import { describe, expect, test } from 'vitest'
import {
  DEFAULT_MAP_LAYERS,
  isDefaultMapLayers,
  parseLayersParam,
  searchWithLayers,
  serializeLayersParam,
  toggleMapLayer,
} from './layersParam.ts'
import { routerSearch } from './routerSearch.ts'

describe('parseLayersParam', () => {
  test('omitted value is every changeset layer on, including spyglass', () => {
    expect(parseLayersParam(undefined)).toEqual(DEFAULT_MAP_LAYERS)
    expect(parseLayersParam(null)).toEqual(DEFAULT_MAP_LAYERS)
    expect(parseLayersParam(1)).toEqual(DEFAULT_MAP_LAYERS)
    expect(isDefaultMapLayers(parseLayersParam(undefined))).toBe(true)
    expect(DEFAULT_MAP_LAYERS.spyglass).toBe(true)
  })

  test('empty string is nothing visible', () => {
    expect(parseLayersParam('')).toEqual({
      showElements: [],
      showActions: [],
      spyglass: false,
    })
  })

  test('reads an explicit set, ignoring unknown tokens', () => {
    expect(parseLayersParam('way,spyglass,nope')).toEqual({
      showElements: ['way'],
      showActions: [],
      spyglass: true,
    })
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
      }),
    ).toBe('create,modify,delete,noop,node,way,relation')
  })

  test('writes an empty string when nothing is visible', () => {
    expect(serializeLayersParam({ showElements: [], showActions: [], spyglass: false })).toBe('')
    expect(
      searchWithLayers({ page: 1 }, { showElements: [], showActions: [], spyglass: false }),
    ).toEqual({ page: 1, layers: '' })
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
})
