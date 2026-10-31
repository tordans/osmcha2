import { describe, expect, test } from 'vitest'
import type { WorkArea } from '../../views/changesetWorkAreas.ts'
import type { ElementChange } from './changesetElements.ts'
import {
  areaLetter,
  assignTagGroupCodes,
  changeListItems,
  nextStep,
  nextUnseen,
  previousStep,
  reviewCursorOf,
  stepInto,
  stepOut,
  stepsOf,
  tagGroupsOf,
  type ChangeListItem,
  type ReviewCursor,
} from './tagGroups.ts'

const ORIGIN = { lon: 13.4, lat: 52.5 }

/** A created tree. `value` makes the tag change; `index` spreads nodes 10 m apart, or 1 km for `far`. */
function tree(id: number, value = 'tree', index = id, far = false): ElementChange {
  return {
    actionType: 'create',
    type: 'node',
    id,
    tags: [{ kind: 'added', key: 'natural', value }],
    lon: ORIGIN.lon + index * (far ? 0.015 : 0.00015),
    lat: ORIGIN.lat,
  }
}

function area(id: number, keys: string[]): WorkArea {
  return { id, bounds: [0, 0, 1, 1], elementKeys: new Set(keys) }
}

function item(...changes: ElementChange[]): ChangeListItem {
  return changes as ChangeListItem
}

describe('areaLetter', () => {
  test('counts like spreadsheet columns', () => {
    expect([1, 2, 8, 26, 27, 28].map(areaLetter)).toEqual(['A', 'B', 'H', 'Z', 'AA', 'AB'])
  })
})

describe('assignTagGroupCodes', () => {
  test('numbers only the groups with several members, per section, in list order', () => {
    const codes = assignTagGroupCodes([
      {
        letter: 'A',
        items: [
          item(tree(1)),
          item(tree(2), tree(3)),
          item(tree(4)),
          item(tree(5), tree(6), tree(7)),
        ],
      },
      { letter: 'B', items: [item(tree(8), tree(9))] },
      { letter: 'X', items: [item(tree(10), tree(11))] },
    ])

    expect(codes.get('node/1')).toBeUndefined()
    expect(codes.get('node/2')?.code).toBe('A1')
    expect(codes.get('node/3')?.code).toBe('A1')
    expect(codes.get('node/4')).toBeUndefined()
    expect(codes.get('node/7')?.code).toBe('A2')
    expect(codes.get('node/8')?.code).toBe('B1')
    expect(codes.get('node/11')?.code).toBe('X1')
    expect(codes.get('node/5')?.memberKeys).toEqual(['node/5', 'node/6', 'node/7'])
  })
})

describe('tagGroupsOf', () => {
  test('without area headings the whole list is area A', () => {
    const changes = [tree(1), tree(2), tree(3, 'bench', 40)]
    const { groupByMember, sectioned } = tagGroupsOf(changes, [])

    expect(sectioned).toBe(false)
    expect(groupByMember.get('node/1')?.code).toBe('A1')
    expect(groupByMember.get('node/2')?.code).toBe('A1')
    expect(groupByMember.has('node/3')).toBe(false)
  })

  test('far-apart changes with the same tag change are not one group', () => {
    const changes = [tree(1), tree(2, 'tree', 1000, true), tree(3, 'tree', 2000, true)]

    expect(tagGroupsOf(changes, []).groupByMember.size).toBe(0)
  })

  test('with headings: area letter, "Other changes" is X, numbering restarts per area', () => {
    const areas = [area(1, ['node/1', 'node/2', 'node/3', 'node/4']), area(2, ['node/5', 'node/6'])]
    const changes = [
      tree(1, 'tree', 1),
      tree(2, 'tree', 2),
      tree(3, 'bench', 40),
      tree(4, 'bench', 41),
      tree(5, 'tree', 100),
      tree(6, 'tree', 101),
      tree(7, 'tree', 200),
      tree(8, 'tree', 201),
    ]
    const { groupByMember, sectioned, sections } = tagGroupsOf(changes, areas)
    const codeOf = (key: string) => groupByMember.get(key)?.code

    expect(sectioned).toBe(true)
    expect(sections.map((section) => section.area?.id ?? null)).toEqual([1, 2, null])
    expect(codeOf('node/1')).toBe('A1')
    expect(codeOf('node/3')).toBe('A2')
    expect(codeOf('node/5')).toBe('B1')
    expect(codeOf('node/7')).toBe('X1')
  })

  test('minor moves are no rows and get no code', () => {
    const moved: ElementChange = { ...tree(9), minorMove: { meters: 1 } }
    const { items, minorMoves } = changeListItems([tree(1), tree(2), moved])

    expect(items.map((row) => row.length)).toEqual([2])
    expect(minorMoves).toEqual([moved])
    expect(tagGroupsOf([tree(1), tree(2), moved], []).groupByMember.has('node/9')).toBe(false)
  })

  test('same inputs give the same result', () => {
    const changes = [tree(1), tree(2)]
    const areas: WorkArea[] = []

    expect(tagGroupsOf(changes, areas)).toBe(tagGroupsOf(changes, areas))
  })

  test('flagged and unflagged builds of the same changes get the same codes', () => {
    const plain = [tree(1), tree(2), tree(3, 'bench', 40), tree(4, 'bench', 41)]
    const flagged = plain.map((change) => ({
      ...change,
      flagged: { reasons: [], reviewedBy: [] },
    })) as unknown as ElementChange[]
    const codes = (changes: ElementChange[]) =>
      [...tagGroupsOf(changes, []).groupByMember].map(([key, group]) => [key, group.code])

    expect(codes(flagged)).toEqual(codes(plain))
  })
})

describe('review steps', () => {
  /** `1`, `[2 3 4]`, `5`, `[6 7]`, then a minor move `8`. */
  const [one, two, three, four, five, six, seven, minor] = [
    tree(1, 'a'),
    tree(2, 'b'),
    tree(3, 'b'),
    tree(4, 'b'),
    tree(5, 'c'),
    tree(6, 'd'),
    tree(7, 'd'),
    { ...tree(8, 'e'), minorMove: { meters: 1 } } as ElementChange,
  ] as [
    ElementChange,
    ElementChange,
    ElementChange,
    ElementChange,
    ElementChange,
    ElementChange,
    ElementChange,
    ElementChange,
  ]
  const tagGroups = tagGroupsOf([one, two, three, four, five, six, seven, minor], [])
  const nothingSeen = () => true
  const seenOnly =
    (...seen: ElementChange[]) =>
    (change: ElementChange) =>
      !seen.includes(change)

  function ids(cursor: ReviewCursor | null | undefined) {
    return cursor && `${cursor.on} ${cursor.changes.map((change) => change.id).join(' ')}`
  }
  function row(change: ElementChange): ReviewCursor {
    return { on: 'row', changes: [change] }
  }
  function group(...changes: ElementChange[]): ReviewCursor {
    return { on: 'group', changes: item(...changes) }
  }

  test('a step is a lone row or a whole group; minor moves are no steps', () => {
    expect(stepsOf(tagGroups).map((step) => step.map((change) => change.id))).toEqual([
      [1],
      [2, 3, 4],
      [5],
      [6, 7],
    ])
  })

  test('reads the cursor: a group wins over a row, unknown keys are no cursor', () => {
    expect(ids(reviewCursorOf(tagGroups, null, null))).toBeNull()
    expect(ids(reviewCursorOf(tagGroups, null, 'node/3'))).toBe('row 3')
    expect(ids(reviewCursorOf(tagGroups, 'node/2', 'node/5'))).toBe('group 2 3 4')
    expect(ids(reviewCursorOf(tagGroups, null, 'node/8'))).toBe('row 8')
    expect(ids(reviewCursorOf(tagGroups, null, 'way/1'))).toBeNull()
  })

  test('next and previous go through all steps, ignoring what is seen', () => {
    expect(ids(nextStep(tagGroups, null))).toBe('row 1')
    expect(ids(nextStep(tagGroups, row(one)))).toBe('group 2 3 4')
    expect(ids(nextStep(tagGroups, group(two, three, four)))).toBe('row 5')
    expect(ids(previousStep(tagGroups, row(five)))).toBe('group 2 3 4')
    expect(ids(previousStep(tagGroups, null))).toBe('group 6 7')
  })

  test('next and previous leave a group from any member, and stop at the ends', () => {
    expect(ids(nextStep(tagGroups, row(three)))).toBe('row 5')
    expect(ids(previousStep(tagGroups, row(three)))).toBe('row 1')
    expect(nextStep(tagGroups, group(six, seven))).toBeUndefined()
    expect(previousStep(tagGroups, row(one))).toBeUndefined()
  })

  test('next and previous from a minor move use its place in the list', () => {
    expect(nextStep(tagGroups, row(minor))).toBeUndefined()
    expect(ids(previousStep(tagGroups, row(minor)))).toBe('group 6 7')
  })

  test('the first S without a cursor lands on the first unseen step', () => {
    expect(ids(nextUnseen(tagGroups, null, nothingSeen))).toBe('row 1')
    expect(ids(nextUnseen(tagGroups, null, seenOnly(one)))).toBe('group 2 3 4')
  })

  test('the S chain lands on groups, not on their members', () => {
    expect(ids(nextUnseen(tagGroups, row(one), seenOnly(one)))).toBe('group 2 3 4')
    const seen = seenOnly(one, two, three, four)
    expect(ids(nextUnseen(tagGroups, group(two, three, four), seen))).toBe('row 5')
  })

  test('S skips seen steps, and a partly seen group is still unseen', () => {
    expect(ids(nextUnseen(tagGroups, row(one), seenOnly(one, two, three, four, five)))).toBe(
      'group 6 7',
    )
    expect(ids(nextUnseen(tagGroups, row(one), seenOnly(one, two, three)))).toBe('group 2 3 4')
  })

  test('S on a member goes to the next member, then to the next step', () => {
    expect(ids(nextUnseen(tagGroups, row(two), seenOnly(two)))).toBe('row 3')
    expect(ids(nextUnseen(tagGroups, row(three), seenOnly(two, three)))).toBe('row 4')
    expect(ids(nextUnseen(tagGroups, row(four), seenOnly(two, three, four)))).toBe('row 5')
  })

  test('S on a late member comes back for the earlier members of the group', () => {
    expect(ids(nextUnseen(tagGroups, row(four), seenOnly(three, four)))).toBe('row 2')
  })

  test('S wraps to the top: nothing left means nothing left in the whole list', () => {
    expect(ids(nextUnseen(tagGroups, group(six, seven), seenOnly(five, six, seven)))).toBe('row 1')
    const allSeen = () => false
    expect(nextUnseen(tagGroups, group(six, seven), allSeen)).toBeUndefined()
    expect(nextUnseen(tagGroups, null, allSeen)).toBeUndefined()
  })

  test('S from a minor move continues after it', () => {
    expect(ids(nextUnseen(tagGroups, row(minor), nothingSeen))).toBe('row 1')
  })

  test('stepping into a group picks its first unseen member, or its first', () => {
    expect(ids(stepInto(group(two, three, four), seenOnly(two)))).toBe('row 3')
    expect(ids(stepInto(group(two, three, four), () => false))).toBe('row 2')
    expect(stepInto(row(one), nothingSeen)).toBeUndefined()
    expect(stepInto(null, nothingSeen)).toBeUndefined()
  })

  test('stepping out goes from a member to its group, and nowhere from anything else', () => {
    expect(ids(stepOut(tagGroups, row(three)))).toBe('group 2 3 4')
    expect(stepOut(tagGroups, row(one))).toBeUndefined()
    expect(stepOut(tagGroups, row(minor))).toBeUndefined()
    expect(stepOut(tagGroups, group(two, three, four))).toBeUndefined()
    expect(stepOut(tagGroups, null)).toBeUndefined()
  })
})
