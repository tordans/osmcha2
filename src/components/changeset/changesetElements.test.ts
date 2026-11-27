import { describe, expect, test } from 'vitest'
import {
  buildElementChanges,
  type AdiffAction,
  groupChangesByTagMutation,
  groupElementChanges,
  matchFlaggedFeature,
  mergeFlaggedFeatures,
  primaryTagMutation,
  tagMutationKey,
  tagMutationRows,
  tagRows,
  wayReversal,
  wayRewritten,
} from './changesetElements.ts'
import { changeListItems } from './tagGroups.ts'

/** Test-only accessor: fails the test with a clear message when the item is missing. */
function at<T>(items: T[], index: number): T {
  const item = items[index]
  if (item === undefined) throw new Error(`expected an item at index ${index}`)
  return item
}

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
    expect(at(changes, 0).nodeStats).toEqual({ added: 1, modified: 1, deleted: 1 })
    expect(at(changes, 0).geometry).toBe('rewritten')
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
    expect(at(changes, 0).geometry).toBe('moved')
    expect(at(changes, 0).nodeStats).toEqual({ added: 0, modified: 5, deleted: 0 })
    expect(at(changes, 1).geometry).toBe('moved')
    expect(at(changes, 2).geometry).toBe('moved')
  })

  test('counts shared member nodes on every way that holds them', () => {
    const way = (id: number, refs: number[]): AdiffAction => ({
      type: 'modify',
      old: { type: 'way', id, version: 1, nodes: refs.slice(1), tags: { highway: 'path' } },
      new: { type: 'way', id, version: 2, nodes: refs, tags: { highway: 'path' } },
    })
    const changes = buildElementChanges([
      way(10, [1, 2, 3]),
      way(11, [3, 4]),
      way(12, [7, 8]),
      { type: 'create', new: { type: 'node', id: 1, version: 1, tags: {} } },
      {
        type: 'modify',
        old: { type: 'node', id: 3, version: 1, lat: 1, lon: 1, tags: {} },
        new: { type: 'node', id: 3, version: 2, lat: 1.1, lon: 1, tags: {} },
      },
      { type: 'delete', old: { type: 'node', id: 4, version: 3, tags: {} } },
      { type: 'noop', new: { type: 'node', id: 2, version: 1 } },
      {
        type: 'modify',
        old: { type: 'node', id: 7, version: 4, tags: {} },
        new: { type: 'node', id: 7, version: 4, tags: {} },
      },
    ])
    expect(changes.map((change) => [`${change.type}/${change.id}`, change.nodeStats])).toEqual([
      ['way/10', { added: 1, modified: 1, deleted: 0 }],
      ['way/11', { added: 0, modified: 1, deleted: 1 }],
      ['way/12', { added: 0, modified: 0, deleted: 0 }],
    ])
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
    expect(at(changes, 0).geometry).toBe('moved')
    expect(at(changes, 0).flagged).toEqual({
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
        old: {
          type: 'way',
          id: 1,
          version: 1,
          nodes: [
            { ref: 1, lon: 13, lat: 52 },
            { ref: 2, lon: 13.001, lat: 52 },
          ],
          tags: { highway: 'residential', name: 'A Street' },
        },
        new: {
          type: 'way',
          id: 1,
          version: 2,
          nodes: [
            { ref: 1, lon: 13, lat: 52 },
            { ref: 2, lon: 13.001, lat: 52 },
          ],
          tags: { highway: 'service', name: 'A Street' },
        },
      },
      {
        type: 'modify',
        old: {
          type: 'way',
          id: 2,
          version: 1,
          nodes: [
            { ref: 2, lon: 13.001, lat: 52 },
            { ref: 3, lon: 13.002, lat: 52 },
          ],
          tags: { highway: 'residential' },
        },
        new: {
          type: 'way',
          id: 2,
          version: 2,
          nodes: [
            { ref: 2, lon: 13.001, lat: 52 },
            { ref: 3, lon: 13.002, lat: 52 },
          ],
          tags: { highway: 'service' },
        },
      },
      {
        type: 'modify',
        old: {
          type: 'way',
          id: 3,
          version: 1,
          nodes: [
            { ref: 8, lon: 13.01, lat: 52.01 },
            { ref: 9, lon: 13.011, lat: 52.01 },
          ],
          tags: { highway: 'residential' },
        },
        new: {
          type: 'way',
          id: 3,
          version: 2,
          nodes: [
            { ref: 8, lon: 13.01, lat: 52.01 },
            { ref: 9, lon: 13.011, lat: 52.01 },
          ],
          tags: { highway: 'footway' },
        },
      },
    ])
    expect(tagMutationKey(at(changes, 0).tags)).toBe(tagMutationKey(at(changes, 1).tags))
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
        old: {
          type: 'way',
          id: 3,
          version: 1,
          nodes: [
            { ref: 7, lon: 13, lat: 52 },
            { ref: 8, lon: 13.001, lat: 52 },
          ],
          tags: { highway: 'residential', name: 'A Street' },
        },
        new: {
          type: 'way',
          id: 3,
          version: 2,
          nodes: [
            { ref: 7, lon: 13, lat: 52 },
            { ref: 8, lon: 13.001, lat: 52 },
          ],
          tags: { highway: 'service', name: 'A Street' },
        },
      },
      {
        type: 'modify',
        old: {
          type: 'way',
          id: 4,
          version: 1,
          nodes: [
            { ref: 8, lon: 13.001, lat: 52 },
            { ref: 9, lon: 13.002, lat: 52 },
          ],
          tags: { highway: 'residential', name: 'A Street' },
        },
        new: {
          type: 'way',
          id: 4,
          version: 2,
          nodes: [
            { ref: 8, lon: 13.001, lat: 52 },
            { ref: 9, lon: 13.002, lat: 52 },
          ],
          tags: { highway: 'service', name: 'A Street' },
        },
      },
    ])
    expect(tagMutationRows(at(changes, 0).tags)).toEqual([])
    expect(tagMutationRows(at(changes, 1).tags)).toEqual([])
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

describe('primaryTagMutation', () => {
  test('prefers a changed name', () => {
    expect(
      primaryTagMutation([
        { kind: 'added', key: 'amenity', value: 'cafe' },
        { kind: 'unchanged', key: 'building', value: 'yes' },
        { kind: 'changed', key: 'name', oldValue: 'A', newValue: 'B' },
      ]),
    ).toEqual({ kind: 'changed', key: 'name', oldValue: 'A', newValue: 'B' })
  })

  test('falls back to the first change and skips unchanged tags', () => {
    expect(
      primaryTagMutation([
        { kind: 'unchanged', key: 'name', value: 'A' },
        { kind: 'removed', key: 'shop', value: 'bakery' },
      ]),
    ).toEqual({ kind: 'removed', key: 'shop', value: 'bakery' })
  })

  test('handles a renamed key', () => {
    expect(
      primaryTagMutation([
        { kind: 'unchanged', key: 'building', value: 'yes' },
        { kind: 'renamed', oldKey: 'capacity:ebike', key: 'capacity:electric_bicycle', value: '4' },
      ]),
    ).toEqual({
      kind: 'renamed',
      oldKey: 'capacity:ebike',
      key: 'capacity:electric_bicycle',
      value: '4',
    })
  })

  test('is null without tag changes', () => {
    expect(primaryTagMutation([{ kind: 'unchanged', key: 'name', value: 'A' }])).toBeNull()
  })
})

describe('split ways', () => {
  const splitActions: AdiffAction[] = [
    {
      type: 'modify',
      old: {
        type: 'way',
        id: 10,
        version: 3,
        nodes: [1, 2, 3, 4, 5],
        tags: { highway: 'residential', name: 'Main Street', surface: 'asphalt' },
      },
      new: {
        type: 'way',
        id: 10,
        version: 4,
        nodes: [1, 2, 3],
        tags: { highway: 'residential', name: 'Main Street', surface: 'asphalt' },
      },
    },
    {
      type: 'create',
      new: {
        type: 'way',
        id: 20,
        version: 1,
        nodes: [3, 4, 5],
        tags: { highway: 'residential', name: 'Main Street', surface: 'paved' },
      },
    },
  ]

  test('links parent and child and diffs the child against the parent’s old tags', () => {
    const [parent, child] = buildElementChanges(splitActions)
    expect(parent?.splitInto).toEqual([20])
    expect(parent?.splitFrom).toBeUndefined()
    expect(child?.splitFrom).toBe(10)
    expect(child?.actionType).toBe('create')
    expect(child?.tags).toEqual([
      { kind: 'unchanged', key: 'highway', value: 'residential' },
      { kind: 'unchanged', key: 'name', value: 'Main Street' },
      { kind: 'changed', key: 'surface', oldValue: 'asphalt', newValue: 'paved' },
    ])
    expect(primaryTagMutation(at(buildElementChanges(splitActions), 1).tags)).toEqual({
      kind: 'changed',
      key: 'surface',
      oldValue: 'asphalt',
      newValue: 'paved',
    })
  })

  test('a split child with identical tags has no tag mutation', () => {
    const [, child] = buildElementChanges([
      at(splitActions, 0),
      {
        type: 'create',
        new: {
          type: 'way',
          id: 20,
          nodes: [3, 4, 5],
          tags: { highway: 'residential', name: 'Main Street', surface: 'asphalt' },
        },
      },
    ])
    expect(child?.splitFrom).toBe(10)
    expect(child ? tagMutationRows(child.tags) : null).toEqual([])
    expect(child ? primaryTagMutation(child.tags) : undefined).toBeNull()
  })

  test('shows added and removed tags relative to the parent', () => {
    const [, child] = buildElementChanges([
      at(splitActions, 0),
      {
        type: 'create',
        new: {
          type: 'way',
          id: 20,
          nodes: [3, 4, 5],
          tags: { highway: 'residential', lit: 'yes' },
        },
      },
    ])
    expect(child?.tags).toEqual([
      { kind: 'unchanged', key: 'highway', value: 'residential' },
      { kind: 'added', key: 'lit', value: 'yes' },
      { kind: 'removed', key: 'name', value: 'Main Street' },
      { kind: 'removed', key: 'surface', value: 'asphalt' },
    ])
  })

  test('leaves unrelated created ways as plain creates', () => {
    const [, child] = buildElementChanges([
      at(splitActions, 0),
      { type: 'create', new: { type: 'way', id: 21, nodes: [90, 91], tags: { highway: 'path' } } },
    ])
    expect(child?.splitFrom).toBeUndefined()
    expect(child?.tags).toEqual([{ kind: 'added', key: 'highway', value: 'path' }])
  })

  test('does not group split children with plain creates that have the same tag changes', () => {
    const changes = buildElementChanges([
      at(splitActions, 0),
      {
        type: 'create',
        new: {
          type: 'way',
          id: 20,
          nodes: [3, 4, 5],
          tags: { highway: 'residential', name: 'Main Street', surface: 'gravel' },
        },
      },
      {
        type: 'create',
        new: {
          type: 'way',
          id: 21,
          nodes: [90, 91],
          tags: { highway: 'residential', name: 'Main Street', surface: 'gravel' },
        },
      },
    ])
    expect(
      groupChangesByTagMutation(changes.filter((change) => change.actionType === 'create')),
    ).toHaveLength(2)
  })
})

describe('buildElementChanges for merged ways', () => {
  const tags = { highway: 'path', surface: 'paving_stones' }
  const mergeActions: AdiffAction[] = [
    { type: 'delete', old: { type: 'way', id: 31, version: 2, nodes: [1, 2], tags } },
    { type: 'delete', old: { type: 'way', id: 40, version: 1, nodes: [8, 9], tags } },
    {
      type: 'modify',
      old: { type: 'way', id: 10, version: 8, nodes: [2, 3], tags },
      new: { type: 'way', id: 10, version: 9, nodes: [1, 2, 3], tags: { ...tags, width: '2' } },
    },
  ]

  test('links the deleted part and the way it became part of, and lists the part after it', () => {
    const changes = buildElementChanges(mergeActions)
    const part = changes.find((change) => change.id === 31)
    expect(part?.mergedInto).toBe(10)
    expect(part?.actionType).toBe('delete')
    // Diffed against the merged way's new tags, not shown as all removed.
    expect(part?.tags).toContainEqual({ kind: 'added', key: 'width', value: '2' })
    expect(part?.tags.filter((row) => row.kind === 'removed')).toEqual([])
    expect(changes.find((change) => change.id === 10)?.mergedFrom).toEqual([31])
    expect(changes.find((change) => change.id === 40)?.mergedInto).toBeUndefined()

    const order = changeListItems(changes).items.map((item) => item.map((change) => change.id))
    expect(order).toEqual([[10], [31], [40]])
  })
})

describe('wayReversal', () => {
  const modifyWay = (oldNodes: number[], newNodes: number[]): AdiffAction => ({
    type: 'modify',
    old: { type: 'way', id: 1, nodes: oldNodes, tags: {} },
    new: { type: 'way', id: 1, nodes: newNodes, tags: {} },
  })

  test('same nodes in the opposite order: reversed only', () => {
    expect(wayReversal(modifyWay([1, 2, 3, 4], [4, 3, 2, 1]))).toEqual({ reshaped: false })
  })

  test('reversed and reshaped', () => {
    expect(wayReversal(modifyWay([1, 2, 3, 4], [4, 9, 3, 1]))).toEqual({ reshaped: true })
  })

  test('a closed way that now runs the other way round, from another start node', () => {
    expect(wayReversal(modifyWay([1, 2, 3, 4, 1], [3, 2, 1, 4, 3]))).toEqual({ reshaped: false })
  })

  test('same direction, or too few kept nodes: not reversed', () => {
    expect(wayReversal(modifyWay([1, 2, 3, 4], [1, 2, 9, 3, 4]))).toBeNull()
    expect(wayReversal(modifyWay([1, 2, 3, 4, 1], [2, 3, 4, 1, 2]))).toBeNull()
    expect(wayReversal(modifyWay([1, 2], [2, 3]))).toBeNull()
    expect(wayReversal(modifyWay([1, 2, 3, 4], [1, 3, 2, 4]))).toBeNull()
  })

  test('buildElementChanges marks the reversed way', () => {
    const [change] = buildElementChanges([modifyWay([1, 2, 3], [3, 2, 1])])
    expect(change?.geometry).toBe('rewritten')
    expect(change?.reversed).toEqual({ reshaped: false })
  })
})

describe('relation member changes', () => {
  const way = (id: number, nodes: number[]) => ({ type: 'way', id, nodes, tags: {} })
  const route = (roles: string[], version = 1) => ({
    type: 'relation',
    id: 5,
    version,
    tags: { type: 'route', route: 'bicycle' },
    members: roles.map((role, index) => ({ type: 'way', ref: String(index + 1), role })),
  })
  const relationAction = (oldRoles: string[], newRoles: string[]): AdiffAction => ({
    type: 'modify',
    old: route(oldRoles),
    new: route(newRoles, 2),
  })

  test('roles swapped on a way reversed in the same changeset: a minor change', () => {
    const changes = buildElementChanges([
      { type: 'modify', old: way(1, [1, 2, 3]), new: way(1, [3, 2, 1]) },
      relationAction(['forward', ''], ['backward', '']),
    ])
    const relation = changes.find((change) => change.type === 'relation')
    expect(relation?.memberChanges).toEqual({
      roles: [{ type: 'way', ref: 1, from: 'forward', to: 'backward' }],
      added: 0,
      removed: 0,
      reordered: false,
    })
    expect(relation?.minorMove).toEqual({ roleFlips: 1 })
  })

  test('roles swapped on a way that kept its direction still need a look', () => {
    const [relation] = buildElementChanges([relationAction(['forward'], ['backward'])])
    expect(relation?.memberChanges?.roles).toHaveLength(1)
    expect(relation?.minorMove).toBeUndefined()
  })

  test('added, removed and reordered members', () => {
    const [relation] = buildElementChanges([
      {
        type: 'modify',
        old: { ...route([]), members: [1, 2, 3].map((ref) => ({ type: 'way', ref, role: '' })) },
        new: { ...route([], 2), members: [3, 1, 4].map((ref) => ({ type: 'way', ref, role: '' })) },
      },
    ])
    expect(relation?.memberChanges).toEqual({ roles: [], added: 1, removed: 1, reordered: true })
  })
})

describe('wayRewritten', () => {
  const way = (refs: number[]) => ({
    type: 'way' as const,
    id: 7,
    version: 1,
    nodes: refs.map((ref) => ({ ref })),
    tags: { highway: 'path' },
  })

  test('closing a line into a ring is a rewrite, not an unchanged way', () => {
    expect(wayRewritten({ type: 'modify', old: way([1, 2, 3]), new: way([1, 2, 3, 1]) })).toBe(true)
  })

  test('the same nodes in the same order are not a rewrite', () => {
    expect(wayRewritten({ type: 'modify', old: way([1, 2, 1]), new: way([1, 2, 1]) })).toBe(false)
  })
})

describe('flagged feature matching across types', () => {
  test('a way flag with a url does not match a node of the same id', () => {
    expect(matchFlaggedFeature('node', 123, [{ osm_id: 123, url: 'way-123' }])).toBeUndefined()
    expect(matchFlaggedFeature('way', 123, [{ osm_id: 123, url: 'way-123' }])).toBeDefined()
  })
})
