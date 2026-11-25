import { describe, expect, test } from 'vitest'
import type { AdiffAction } from './changesetElements.ts'
import { detectWayMerges, detectWaySplits } from './waySplits.ts'

function modifyWay(id: number, oldNodes: number[], newNodes: number[]): AdiffAction {
  return {
    type: 'modify',
    old: { type: 'way', id, version: 1, nodes: oldNodes.map((ref) => ({ ref })) },
    new: { type: 'way', id, version: 2, nodes: newNodes.map((ref) => ({ ref })) },
  }
}

function createWay(id: number, nodes: Array<number | { ref: number }>): AdiffAction {
  return {
    type: 'create',
    new: {
      type: 'way',
      id,
      version: 1,
      nodes: nodes.map((node) => (typeof node === 'number' ? { ref: node } : node)),
    },
  }
}

describe('detectWaySplits', () => {
  test('finds a simple split into two parts', () => {
    const { parentByChild, childrenByParent } = detectWaySplits([
      modifyWay(10, [1, 2, 3, 4, 5], [1, 2, 3]),
      createWay(20, [3, 4, 5]),
    ])
    expect(parentByChild).toEqual(new Map([['way/20', 10]]))
    expect(childrenByParent).toEqual(new Map([[10, [20]]]))
  })

  test('finds a split into three parts, all pointing at the original way', () => {
    const { parentByChild, childrenByParent } = detectWaySplits([
      modifyWay(10, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3]),
      createWay(20, [3, 4, 5]),
      createWay(21, [5, 6, 7]),
    ])
    expect(parentByChild).toEqual(
      new Map([
        ['way/20', 10],
        ['way/21', 10],
      ]),
    )
    expect(childrenByParent).toEqual(new Map([[10, [20, 21]]]))
  })

  test('finds a split when the child runs in reverse order', () => {
    const { parentByChild } = detectWaySplits([
      modifyWay(10, [1, 2, 3, 4, 5], [1, 2, 3]),
      createWay(20, [5, 4, 3]),
    ])
    expect(parentByChild.get('way/20')).toBe(10)
  })

  test('works with plain numbers as nodes', () => {
    const { parentByChild } = detectWaySplits([
      {
        type: 'modify',
        old: { type: 'way', id: 10, nodes: [1, 2, 3, 4] },
        new: { type: 'way', id: 10, nodes: [1, 2] },
      },
      { type: 'create', new: { type: 'way', id: 20, nodes: [2, 3, 4] } },
    ])
    expect(parentByChild.get('way/20')).toBe(10)
  })

  test('does not treat a way that only touches the modified way at one node as a split', () => {
    const { parentByChild } = detectWaySplits([
      modifyWay(10, [1, 2, 3, 4, 5], [1, 2, 3]),
      createWay(20, [3, 90, 91]),
    ])
    expect(parentByChild.size).toBe(0)
  })

  test('does not treat a modified way that kept all its nodes as a parent', () => {
    const { parentByChild } = detectWaySplits([
      modifyWay(10, [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]),
      createWay(20, [3, 4, 5]),
    ])
    expect(parentByChild.size).toBe(0)
  })

  test('still finds a split when the child has extra new nodes beyond the shared run', () => {
    const { parentByChild } = detectWaySplits([
      modifyWay(10, [1, 2, 3, 4, 5], [1, 2, 3]),
      createWay(20, [3, 4, 5, 92, 93]),
    ])
    expect(parentByChild.get('way/20')).toBe(10)
  })

  test('picks the parent sharing the most nodes', () => {
    const { parentByChild, childrenByParent } = detectWaySplits([
      modifyWay(10, [1, 2, 3, 4], [1, 2]),
      modifyWay(11, [3, 4, 5, 6, 7], [3, 4]),
      createWay(20, [3, 4, 5, 6, 7]),
    ])
    expect(parentByChild.get('way/20')).toBe(11)
    expect(childrenByParent.get(10)).toBeUndefined()
  })

  test('ignores closed rings', () => {
    expect(
      detectWaySplits([modifyWay(10, [1, 2, 3, 4, 1], [1, 2, 3]), createWay(20, [3, 4, 1])])
        .parentByChild.size,
    ).toBe(0)
    expect(
      detectWaySplits([modifyWay(10, [1, 2, 3, 4, 5], [1, 2, 3]), createWay(20, [3, 4, 5, 3])])
        .parentByChild.size,
    ).toBe(0)
  })

  test('ignores deleted parents, modified children, and missing node data', () => {
    expect(
      detectWaySplits([
        {
          type: 'delete',
          old: { type: 'way', id: 10, nodes: [{ ref: 1 }, { ref: 2 }, { ref: 3 }] },
        },
        createWay(20, [1, 2, 3]),
      ]).parentByChild.size,
    ).toBe(0)
    expect(
      detectWaySplits([modifyWay(10, [1, 2, 3, 4], [1, 2]), modifyWay(20, [2, 3, 4], [2, 3, 4])])
        .parentByChild.size,
    ).toBe(0)
    expect(
      detectWaySplits([
        { type: 'modify', old: { type: 'way', id: 10 }, new: { type: 'way', id: 10 } },
        { type: 'create', new: { type: 'way', id: 20 } },
      ]).parentByChild.size,
    ).toBe(0)
    expect(detectWaySplits().parentByChild.size).toBe(0)
  })
})

function deleteWay(id: number, nodes: number[]): AdiffAction {
  return {
    type: 'delete',
    old: { type: 'way', id, version: 2, nodes: nodes.map((ref) => ({ ref })) },
  }
}

describe('detectWayMerges', () => {
  // Changeset 192453379: way 1131268876 absorbed two short ways in front of it.
  test('finds deleted ways that became part of a longer way', () => {
    const { survivorByPart, partsBySurvivor } = detectWayMerges([
      deleteWay(31, [1, 2]),
      deleteWay(32, [2, 3, 4]),
      modifyWay(10, [4, 5, 6], [1, 2, 3, 4, 5, 6]),
    ])
    expect(survivorByPart).toEqual(
      new Map([
        ['way/31', 10],
        ['way/32', 10],
      ]),
    )
    expect(partsBySurvivor).toEqual(new Map([[10, [31, 32]]]))
  })

  test('finds a part drawn the other way round', () => {
    const { survivorByPart } = detectWayMerges([
      deleteWay(31, [3, 2, 1]),
      modifyWay(10, [3, 4], [1, 2, 3, 4]),
    ])
    expect(survivorByPart.get('way/31')).toBe(10)
  })

  test('ignores a deleted way that only touches the modified way', () => {
    const { survivorByPart } = detectWayMerges([
      deleteWay(31, [9, 1]),
      modifyWay(10, [3, 4], [1, 2, 3, 4]),
    ])
    expect(survivorByPart.size).toBe(0)
  })

  test('ignores a way that did not grow', () => {
    const { survivorByPart } = detectWayMerges([
      deleteWay(31, [1, 2]),
      modifyWay(10, [1, 2, 3], [1, 2, 3]),
    ])
    expect(survivorByPart.size).toBe(0)
  })
})
