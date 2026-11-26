import { describe, expect, test } from 'vitest'
import type { ElementChange } from './changesetElements.ts'
import { orderByConnectivity } from './wayChains.ts'

function way(id: number, refs: number[]): ElementChange {
  return {
    actionType: 'modify',
    type: 'way',
    id,
    tags: [],
    wayShape: { refs, closed: false },
  } as unknown as ElementChange
}

const ids = (changes: ElementChange[]) => changes.map((change) => change.id)

describe('orderByConnectivity', () => {
  test('walks the street from where its line direction starts', () => {
    expect(ids(orderByConnectivity([way(3, [3, 4]), way(1, [1, 2]), way(2, [2, 3])]))).toEqual([
      1, 2, 3,
    ])
  })

  test('follows ways that run against each other', () => {
    expect(ids(orderByConnectivity([way(2, [3, 2]), way(3, [3, 4]), way(1, [1, 2])]))).toEqual([
      1, 2, 3,
    ])
  })

  test('pieces that do not touch form chains after each other', () => {
    expect(
      ids(
        orderByConnectivity([way(10, [10, 11]), way(2, [2, 3]), way(1, [1, 2]), way(11, [11, 12])]),
      ),
    ).toEqual([10, 11, 1, 2])
  })

  test('keeps the order of groups with nodes', () => {
    const node = { actionType: 'modify', type: 'node', id: 5, tags: [] } as unknown as ElementChange
    expect(ids(orderByConnectivity([way(2, [2, 3]), node, way(1, [1, 2])]))).toEqual([2, 5, 1])
  })
})
