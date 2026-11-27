import { describe, expect, test } from 'vitest'
import {
  buildElementChanges,
  groupChangesByTagMutation,
  splitTagRows,
  tagMutationKey,
  tagMutationRows,
  tagRows,
} from './changesetElements.ts'
import { orderTagRows, type TagRow, tagRowKeys } from './tagRows.ts'

describe('key renames', () => {
  const modify = (oldTags: Record<string, string>, newTags: Record<string, string>) =>
    tagRows({ type: 'modify', old: { tags: oldTags }, new: { tags: newTags } })

  test('merges a removed and an added key with the same value', () => {
    expect(
      modify(
        { amenity: 'charging_station', 'capacity:ebike': '4' },
        { amenity: 'charging_station', 'capacity:electric_bicycle': '4' },
      ),
    ).toEqual([
      { kind: 'unchanged', key: 'amenity', value: 'charging_station' },
      { kind: 'renamed', oldKey: 'capacity:ebike', key: 'capacity:electric_bicycle', value: '4' },
    ])
  })

  test('keeps added and removed when the values differ', () => {
    expect(modify({ 'capacity:ebike': '4' }, { 'capacity:electric_bicycle': '5' })).toEqual([
      { kind: 'added', key: 'capacity:electric_bicycle', value: '5' },
      { kind: 'removed', key: 'capacity:ebike', value: '4' },
    ])
  })

  test('is not a rename when the values differ, even if another key changed to the added value', () => {
    // `b` changed from 1 to 2 while `a` (1) was removed and `c` (2) added: values do not pair up.
    expect(modify({ a: '1', b: '1' }, { b: '2', c: '2' })).toEqual([
      { kind: 'changed', key: 'b', oldValue: '1', newValue: '2' },
      { kind: 'added', key: 'c', value: '2' },
      { kind: 'removed', key: 'a', value: '1' },
    ])
  })

  test('pairs several candidates with the same value by key similarity', () => {
    const rows = modify(
      { 'roof:colour': 'red', 'wall:colour': 'red', lit: 'yes' },
      { 'roof:color': 'red', 'wall:color': 'red', lit: 'yes' },
    )
    expect(rows).toContainEqual({
      kind: 'renamed',
      oldKey: 'roof:colour',
      key: 'roof:color',
      value: 'red',
    })
    expect(rows).toContainEqual({
      kind: 'renamed',
      oldKey: 'wall:colour',
      key: 'wall:color',
      value: 'red',
    })
    expect(rows).toHaveLength(3)
  })

  test('leaves unrelated keys with a shared value alone when the pairing is ambiguous', () => {
    expect(modify({ bench: 'yes', lit: 'yes' }, { shelter: 'yes', covered: 'yes' })).toEqual([
      { kind: 'added', key: 'shelter', value: 'yes' },
      { kind: 'added', key: 'covered', value: 'yes' },
      { kind: 'removed', key: 'bench', value: 'yes' },
      { kind: 'removed', key: 'lit', value: 'yes' },
    ])
  })

  test('renames only the best match when there are more added keys than removed ones', () => {
    const rows = modify(
      { 'capacity:ebike': '4' },
      { 'capacity:electric_bicycle': '4', 'capacity:bicycle': '4' },
    )
    expect(rows.map((row) => row.kind).sort()).toEqual(['added', 'renamed'])
  })

  test('never renames on create or delete', () => {
    expect(tagRows({ type: 'create', new: { tags: { a: '1' } } })[0]?.kind).toBe('added')
    expect(tagRows({ type: 'delete', old: { tags: { a: '1' } } })[0]?.kind).toBe('removed')
  })

  test('applies to the diff of a way split off its parent', () => {
    expect(
      splitTagRows(
        { type: 'modify', old: { tags: { highway: 'service', surface_type: 'asphalt' } } },
        { type: 'create', new: { tags: { highway: 'service', surface: 'asphalt' } } },
      ),
    ).toEqual([
      { kind: 'unchanged', key: 'highway', value: 'service' },
      { kind: 'renamed', oldKey: 'surface_type', key: 'surface', value: 'asphalt' },
    ])
  })

  test('counts as a tag mutation with its own key, and answers to both keys', () => {
    const renamed = modify({ 'capacity:ebike': '4' }, { 'capacity:electric_bicycle': '4' })
    const added = modify({}, { 'capacity:electric_bicycle': '4' })
    expect(tagMutationRows(renamed)).toHaveLength(1)
    expect(tagMutationKey(renamed)).not.toBe(tagMutationKey(added))
    expect(tagMutationKey(renamed)).toBe(
      tagMutationKey(modify({ 'capacity:ebike': '4' }, { 'capacity:electric_bicycle': '4' })),
    )
    expect(tagRowKeys({ key: 'new', oldKey: 'old' })).toEqual(['new', 'old'])
    expect(tagRowKeys({ key: 'plain' })).toEqual(['plain'])
  })

  test('groups elements that renamed the same key', () => {
    const rename = (id: number) => ({
      type: 'modify',
      old: {
        type: 'node',
        id,
        version: 1,
        lon: 13,
        lat: 52,
        tags: { amenity: 'charging_station', 'capacity:ebike': '4' },
      },
      new: {
        type: 'node',
        id,
        version: 2,
        lon: 13,
        lat: 52,
        tags: { amenity: 'charging_station', 'capacity:electric_bicycle': '4' },
      },
    })
    const changes = buildElementChanges([rename(1), rename(2)])
    expect(
      groupChangesByTagMutation(changes).map((group) => group.map((change) => change.id)),
    ).toEqual([[1, 2]])
  })
})

describe('orderTagRows', () => {
  test('puts renamed, changed, added, removed first by key, then unchanged by key', () => {
    const rows: TagRow[] = [
      { kind: 'unchanged', key: 'name', value: 'x' },
      { kind: 'removed', key: 'zzz', value: '1' },
      { kind: 'added', key: 'b', value: '1' },
      { kind: 'unchanged', key: 'amenity', value: 'y' },
      { kind: 'changed', key: 'surface', oldValue: 'a', newValue: 'b' },
      { kind: 'added', key: 'a', value: '1' },
      { kind: 'renamed', oldKey: 'capacity:ebike', key: 'capacity:electric_bicycle', value: '4' },
      { kind: 'changed', key: 'lit', oldValue: 'a', newValue: 'b' },
    ]
    const { mutations, unchanged } = orderTagRows(rows)
    expect(mutations.map((row) => `${row.kind}:${row.key}`)).toEqual([
      'renamed:capacity:electric_bicycle',
      'changed:lit',
      'changed:surface',
      'added:a',
      'added:b',
      'removed:zzz',
    ])
    expect(unchanged.map((row) => row.key)).toEqual(['amenity', 'name'])
  })

  test('does not change the given rows', () => {
    const rows: TagRow[] = [
      { kind: 'unchanged', key: 'b', value: '1' },
      { kind: 'added', key: 'a', value: '1' },
    ]
    orderTagRows(rows)
    expect(rows.map((row) => row.key)).toEqual(['b', 'a'])
  })

  test('returns empty blocks for no rows', () => {
    expect(orderTagRows([])).toEqual({ mutations: [], unchanged: [] })
  })
})
