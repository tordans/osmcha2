import { describe, expect, test } from 'vitest'
import {
  buildElementChanges,
  groupChangesByTagMutation,
  groupElementChanges,
  matchFlaggedFeature,
  mergeFlaggedFeatures,
  tagMutationKey,
  tagMutationRows,
  tagRows,
} from './changesetElements.ts'

describe('tagRows', () => {
  test('splits added, removed, changed, and unchanged tags', () => {
    const rows = tagRows({
      type: 'modify',
      old: { tags: { name: 'Old', highway: 'residential', lit: 'yes' } },
      new: { tags: { name: 'New', highway: 'residential', maxspeed: '30' } },
    })
    expect(rows).toEqual([
      { kind: 'changed', key: 'name', oldValue: 'Old', newValue: 'New' },
      { kind: 'unchanged', key: 'highway', value: 'residential' },
      { kind: 'added', key: 'maxspeed', value: '30' },
      { kind: 'removed', key: 'lit', value: 'yes' },
    ])
  })

  test('treats create tags as added and delete tags as removed', () => {
    expect(tagRows({ type: 'create', new: { tags: { amenity: 'bench' } } })).toEqual([
      { kind: 'added', key: 'amenity', value: 'bench' },
    ])
    expect(tagRows({ type: 'delete', old: { tags: { amenity: 'bench' } } })).toEqual([
      { kind: 'removed', key: 'amenity', value: 'bench' },
    ])
  })
})

describe('buildElementChanges', () => {
  test('groups create/modify/delete and skips noop', () => {
    const changes = buildElementChanges([
      { type: 'create', new: { type: 'node', id: 1, version: 1, tags: { amenity: 'bench' } } },
      {
        type: 'modify',
        old: { type: 'node', id: 2, version: 4, tags: { name: 'A' } },
        new: { type: 'node', id: 2, version: 5, tags: { name: 'B' } },
      },
      {
        type: 'delete',
        old: { type: 'node', id: 3, version: 2, tags: { amenity: 'waste_basket' } },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 4, version: 1, tags: { name: 'Same' } },
        new: { type: 'node', id: 4, version: 1, tags: { name: 'Same' } },
      },
      { type: 'noop', new: { type: 'node', id: 5, version: 1 } },
    ])
    expect(changes.map((change) => [change.actionType, change.id])).toEqual([
      ['create', 1],
      ['modify', 2],
      ['delete', 3],
    ])
    expect(groupElementChanges(changes).map(([action, items]) => [action, items.length])).toEqual([
      ['create', 1],
      ['modify', 1],
      ['delete', 1],
    ])
  })

  test('hides untagged way-member nodes and counts them on the way', () => {
    const changes = buildElementChanges([
      {
        type: 'modify',
        old: {
          type: 'way',
          id: 10,
          version: 1,
          nodes: [{ ref: 1 }, { ref: 2 }],
          tags: { highway: 'path' },
        },
        new: {
          type: 'way',
          id: 10,
          version: 2,
          nodes: [{ ref: 1 }, { ref: 3 }],
          tags: { highway: 'path' },
        },
      },
      { type: 'create', new: { type: 'node', id: 3, version: 1, tags: {} } },
      { type: 'delete', old: { type: 'node', id: 2, version: 1, tags: {} } },
      {
        type: 'modify',
        old: { type: 'node', id: 1, version: 1, lat: 1, lon: 1, tags: {} },
        new: { type: 'node', id: 1, version: 2, lat: 1.1, lon: 1, tags: {} },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 9, version: 1, tags: { amenity: 'bench' } },
        new: { type: 'node', id: 9, version: 2, tags: { amenity: 'bench', name: 'Rest' } },
      },
    ])
    expect(changes.map((change) => `${change.type}/${change.id}`)).toEqual(['way/10', 'node/9'])
    expect(changes[0].nodeStats).toEqual({ added: 1, modified: 1, deleted: 1 })
    expect(changes[0].geometry).toBe('rewritten')
  })

  test('lists a same-version way whose members moved and folds untagged members into it', () => {
    const wayNodes = (lonShift: number) => [
      { ref: 1, lon: 10 + lonShift, lat: 48 },
      { ref: 2, lon: 11 + lonShift, lat: 48 },
      { ref: 3, lon: 11 + lonShift, lat: 47 },
      { ref: 4, lon: 10 + lonShift, lat: 47 },
      { ref: 9, lon: 10 + lonShift, lat: 48 },
      { ref: 1, lon: 10 + lonShift, lat: 48 },
    ]
    const changes = buildElementChanges([
      {
        type: 'modify',
        old: {
          type: 'way',
          id: 10,
          version: 5,
          nodes: wayNodes(0),
          tags: { building: 'yes', name: 'Wash' },
        },
        new: {
          type: 'way',
          id: 10,
          version: 5,
          nodes: wayNodes(0.001),
          tags: { building: 'yes', name: 'Wash' },
        },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 1, version: 1, lat: 48, lon: 10, tags: {} },
        new: { type: 'node', id: 1, version: 2, lat: 48, lon: 10.001, tags: {} },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 2, version: 1, lat: 48, lon: 11, tags: {} },
        new: { type: 'node', id: 2, version: 2, lat: 48, lon: 11.001, tags: {} },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 3, version: 1, lat: 47, lon: 11, tags: {} },
        new: { type: 'node', id: 3, version: 2, lat: 47, lon: 11.001, tags: {} },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 4, version: 1, lat: 47, lon: 10, tags: {} },
        new: { type: 'node', id: 4, version: 2, lat: 47, lon: 10.001, tags: {} },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 9, version: 1, lat: 48, lon: 10, tags: { entrance: 'yes' } },
        new: { type: 'node', id: 9, version: 2, lat: 48, lon: 10.001, tags: { entrance: 'yes' } },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 99, version: 1, lat: 1, lon: 1, tags: {} },
        new: { type: 'node', id: 99, version: 2, lat: 1.1, lon: 1, tags: {} },
      },
    ])
    expect(changes.map((change) => `${change.type}/${change.id}`)).toEqual([
      'way/10',
      'node/9',
      'node/99',
    ])
    expect(changes[0].geometry).toBe('moved')
    expect(changes[0].nodeStats).toEqual({ added: 0, modified: 5, deleted: 0 })
    expect(changes[1].geometry).toBe('moved')
    expect(changes[2].geometry).toBe('moved')
  })

  test('still skips a same-version way whose member geometry did not change', () => {
    const nodes = [
      { ref: 1, lon: 10, lat: 48 },
      { ref: 2, lon: 11, lat: 48 },
    ]
    const changes = buildElementChanges([
      {
        type: 'modify',
        old: { type: 'way', id: 10, version: 3, nodes, tags: { highway: 'path' } },
        new: { type: 'way', id: 10, version: 3, nodes, tags: { highway: 'path' } },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 8, version: 1, lat: 1, lon: 2, tags: { highway: 'crossing' } },
        new: { type: 'node', id: 8, version: 2, lat: 1.2, lon: 2, tags: { highway: 'crossing' } },
      },
    ])
    expect(changes.map((change) => `${change.type}/${change.id}`)).toEqual(['node/8'])
  })

  test('marks moved nodes and matching flagged features', () => {
    const changes = buildElementChanges(
      [
        {
          type: 'modify',
          old: { type: 'node', id: 8, version: 1, lat: 1, lon: 2, tags: { highway: 'crossing' } },
          new: { type: 'node', id: 8, version: 2, lat: 1.2, lon: 2, tags: { highway: 'crossing' } },
        },
      ],
      [{ url: 'node-8', name: 'Crossing', reasons: [11], note: 'moved far' }],
      [{ id: 11, name: 'Suspicious geometry' }],
    )
    expect(changes[0].geometry).toBe('moved')
    expect(changes[0].flagged).toEqual({
      name: 'Crossing',
      note: 'moved far',
      userFlag: undefined,
      reasons: ['Suspicious geometry'],
    })
  })
})

describe('groupChangesByTagMutation', () => {
  test('groups elements that share the same tag value change', () => {
    const changes = buildElementChanges([
      {
        type: 'modify',
        old: { type: 'way', id: 1, version: 1, tags: { highway: 'residential', name: 'A Street' } },
        new: { type: 'way', id: 1, version: 2, tags: { highway: 'service', name: 'A Street' } },
      },
      {
        type: 'modify',
        old: { type: 'way', id: 2, version: 1, tags: { highway: 'residential', name: 'B Street' } },
        new: { type: 'way', id: 2, version: 2, tags: { highway: 'service', name: 'B Street' } },
      },
      {
        type: 'modify',
        old: { type: 'way', id: 3, version: 1, tags: { highway: 'residential' } },
        new: { type: 'way', id: 3, version: 2, tags: { highway: 'footway' } },
      },
    ])
    expect(tagMutationKey(changes[0].tags)).toBe(tagMutationKey(changes[1].tags))
    expect(
      groupChangesByTagMutation(changes).map((group) => group.map((change) => change.id)),
    ).toEqual([[1, 2], [3]])
  })

  test('does not split a retag when other tags differ', () => {
    const left = tagRows({
      type: 'modify',
      old: { tags: { highway: 'path', name: 'North' } },
      new: { tags: { highway: 'footway', name: 'North' } },
    })
    const right = tagRows({
      type: 'modify',
      old: { tags: { highway: 'path', name: 'South' } },
      new: { tags: { highway: 'footway', name: 'South' } },
    })
    expect(tagMutationKey(left)).toBe(tagMutationKey(right))
  })

  test('does not group elements that have no tag mutations', () => {
    const changes = buildElementChanges([
      {
        type: 'modify',
        old: { type: 'node', id: 1, version: 1, lat: 1, lon: 1, tags: { highway: 'crossing' } },
        new: { type: 'node', id: 1, version: 2, lat: 1.1, lon: 1, tags: { highway: 'crossing' } },
      },
      {
        type: 'modify',
        old: { type: 'node', id: 2, version: 1, lat: 2, lon: 2, tags: { highway: 'crossing' } },
        new: { type: 'node', id: 2, version: 2, lat: 2.1, lon: 2, tags: { highway: 'crossing' } },
      },
      {
        type: 'modify',
        old: { type: 'way', id: 3, version: 1, tags: { highway: 'residential', name: 'A Street' } },
        new: { type: 'way', id: 3, version: 2, tags: { highway: 'service', name: 'A Street' } },
      },
      {
        type: 'modify',
        old: { type: 'way', id: 4, version: 1, tags: { highway: 'residential', name: 'B Street' } },
        new: { type: 'way', id: 4, version: 2, tags: { highway: 'service', name: 'B Street' } },
      },
    ])
    expect(tagMutationRows(changes[0].tags)).toEqual([])
    expect(tagMutationRows(changes[1].tags)).toEqual([])
    expect(
      groupChangesByTagMutation(changes).map((group) => group.map((change) => change.id)),
    ).toEqual([[1], [2], [3, 4]])
  })
})

describe('flagged feature matching', () => {
  test('matches url, type/id, and reviewed-feature flags', () => {
    expect(matchFlaggedFeature('way', 5, [{ url: 'way-5', name: 'Park' }])?.name).toBe('Park')
    const merged = mergeFlaggedFeatures(
      [{ url: 'node-1', osm_id: 1, type: 'node' }],
      [
        { id: 'node-1', user: 'alice' },
        { id: 'way-2', user: 'bob' },
      ],
    )
    expect(merged.find((feature) => feature.url === 'node-1')?.user_flag).toBe('Flagged by alice')
    expect(merged.find((feature) => feature.url === 'way-2')?.user_flag).toBe('Flagged by bob')
  })
})
