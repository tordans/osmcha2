import { describe, expect, test } from 'vitest'
import type { WorkArea } from '../../views/changesetWorkAreas.ts'
import type { ElementChange } from './changesetElements.ts'
import { groupChangesByWorkArea } from './workAreaChanges.ts'

function change(type: ElementChange['type'], id: number): ElementChange {
  return { actionType: 'modify', type, id, tags: [] }
}

function area(id: number, keys: string[]): WorkArea {
  return { id, bounds: [0, 0, 1, 1], elementKeys: new Set(keys) }
}

describe('groupChangesByWorkArea', () => {
  const areas = [area(1, ['node/1', 'way/5']), area(2, ['node/2'])]

  test('lists each change under its area, in area order', () => {
    const groups = groupChangesByWorkArea(
      [change('node', 2), change('way', 5), change('node', 1)],
      areas,
    )

    expect(groups.map((group) => [group.area?.id, group.changes.map((item) => item.id)])).toEqual([
      [1, [5, 1]],
      [2, [2]],
    ])
  })

  test('collects changes outside every area at the end', () => {
    const groups = groupChangesByWorkArea([change('relation', 9), change('node', 1)], areas)

    expect(groups[groups.length - 1]).toEqual({ area: null, changes: [change('relation', 9)] })
  })
})
