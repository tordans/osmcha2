import type { NonEmptyArray } from '../../utils/nonEmptyArray.ts'
import type { WorkArea } from '../../views/changesetWorkAreas.ts'
import {
  groupChangesByTagMutation,
  groupElementChanges,
  type ElementChange,
} from './changesetElements.ts'
import { groupChangesByWorkArea } from './workAreaChanges.ts'

/** One row of the Changes list: a lone change, or two or more changes with the same tag change. */
export type ChangeListItem = NonEmptyArray<ElementChange>

export type TagGroupSection = {
  /** `null`: the "Other changes" section, or the whole list when it has no area headings. */
  area: WorkArea | null
  changes: ElementChange[]
  items: ChangeListItem[]
  minorMoves: ElementChange[]
}

/** Several elements with the same tag change in one place, as listed under "Same tag changes". */
export type TagGroup = {
  /** Short name shown in the list and on the map, e.g. `A1`. */
  code: string
  /** `node/123`-style keys of every member, in list order. */
  memberKeys: string[]
}

export type TagGroups = {
  sections: TagGroupSection[]
  /** `true` when the list shows one heading per work area. */
  sectioned: boolean
  groupByMember: ReadonlyMap<string, TagGroup>
}

/** Letter of the section "Other changes". There are at most 8 work areas (A to H), so no clash. */
export const OTHER_CHANGES_LETTER = 'X'

export function changeKey(change: Pick<ElementChange, 'type' | 'id'>) {
  return `${change.type}/${change.id}`
}

/** Area 1 → A, Area 2 → B, … Area 27 → AA. */
export function areaLetter(areaId: number): string {
  let rest = Math.max(1, Math.floor(areaId))
  let letters = ''
  while (rest > 0) {
    const offset = (rest - 1) % 26
    letters = String.fromCharCode(65 + offset) + letters
    rest = Math.floor((rest - 1) / 26)
  }
  return letters
}

/**
 * The rows of one section, in list order: changes by action (create, modify, delete), each action
 * split into same-tag-change groups. Minor moves are not rows; they sit in their own group.
 */
export function changeListItems(changes: ElementChange[]) {
  const listed = changes.filter((change) => change.minorMove == null)
  const minorMoves = changes.filter((change) => change.minorMove != null)
  const items = groupElementChanges(listed).flatMap(([, actionChanges]) =>
    groupChangesByTagMutation(actionChanges),
  )
  return { items, minorMoves }
}

/**
 * Names the groups with two or more members: the section letter plus the 1-based position among
 * those groups within the section. Lone changes and minor moves get no code.
 */
export function assignTagGroupCodes(
  sections: ReadonlyArray<{ letter: string; items: ReadonlyArray<ChangeListItem> }>,
): Map<string, TagGroup> {
  const groupByMember = new Map<string, TagGroup>()
  for (const { letter, items } of sections) {
    let index = 0
    for (const item of items) {
      if (item.length < 2) continue
      index += 1
      const group: TagGroup = { code: `${letter}${index}`, memberKeys: item.map(changeKey) }
      for (const key of group.memberKeys) groupByMember.set(key, group)
    }
  }
  return groupByMember
}

function computeTagGroups(changes: ElementChange[], areas: readonly WorkArea[]): TagGroups {
  const sectioned = areas.length > 1
  const sections: TagGroupSection[] = sectioned
    ? groupChangesByWorkArea(changes, areas).map(({ area, changes: areaChanges }) => ({
        area,
        changes: areaChanges,
        ...changeListItems(areaChanges),
      }))
    : [{ area: null, changes, ...changeListItems(changes) }]
  const groupByMember = assignTagGroupCodes(
    sections.map((section) => ({
      // An unsectioned list is one area, the first.
      letter: section.area ? areaLetter(section.area.id) : sectioned ? OTHER_CHANGES_LETTER : 'A',
      items: section.items,
    })),
  )
  return { sections, sectioned, groupByMember }
}

const cache = new WeakMap<ElementChange[], WeakMap<readonly WorkArea[], TagGroups>>()

/**
 * Where the review keys act: a whole group with no member selected, or one row, which is the URL
 * `ref`. `changes` is what a key marks: all members of the group, or the row alone.
 */
export type ReviewCursor = { on: 'group' | 'row'; changes: ChangeListItem }

/** Everything in the list, in list order. Minor moves keep a place here but are not steps. */
function listedItems({ sections }: TagGroups) {
  return sections.flatMap(({ items, minorMoves }) => [
    ...items,
    ...minorMoves.map((change): ChangeListItem => [change]),
  ])
}

function isStep([first]: ChangeListItem) {
  return first.minorMove == null
}

/** One move of the review: a lone row, or a whole "Same tag changes" group. Skips minor moves. */
export function stepsOf(tagGroups: TagGroups) {
  return listedItems(tagGroups).filter(isStep)
}

function cursorOnStep(step: ChangeListItem): ReviewCursor {
  return { on: step.length > 1 ? 'group' : 'row', changes: step }
}

function indexOfItem(items: ChangeListItem[], cursor: ReviewCursor | null) {
  if (!cursor) return -1
  const key = changeKey(cursor.changes[0])
  return items.findIndex((item) => item.some((change) => changeKey(change) === key))
}

/** What follows `index`, then what precedes it. */
function wrappedAfter<T>(list: readonly T[], index: number) {
  return [...list.slice(index + 1), ...list.slice(0, Math.max(index, 0))]
}

/** The cursor for a group's first member key or, without one, the selected row's key. */
export function reviewCursorOf(
  tagGroups: TagGroups,
  groupCursorKey: string | null,
  selectedKey: string | null,
): ReviewCursor | null {
  const key = groupCursorKey ?? selectedKey
  if (key == null) return null
  const item = listedItems(tagGroups).find((candidate) =>
    candidate.some((change) => changeKey(change) === key),
  )
  if (!item) return null
  if (groupCursorKey != null) return { on: 'group', changes: item }
  const change = item.find((candidate) => changeKey(candidate) === key)
  return change ? { on: 'row', changes: [change] } : null
}

/** The step after the cursor, seen or not; the first step without a cursor. */
export function nextStep(tagGroups: TagGroups, cursor: ReviewCursor | null) {
  const items = listedItems(tagGroups)
  const step = items.slice(indexOfItem(items, cursor) + 1).find(isStep)
  return step && cursorOnStep(step)
}

/** The step before the cursor, seen or not; the last step without a cursor. */
export function previousStep(tagGroups: TagGroups, cursor: ReviewCursor | null) {
  const items = listedItems(tagGroups)
  const at = indexOfItem(items, cursor)
  const step = (at < 0 ? items : items.slice(0, at)).findLast(isStep)
  return step && cursorOnStep(step)
}

/**
 * Where the S key goes: from a row to the next unseen row of its group, else to the next unseen
 * step, wrapping to the top so that "nothing left" means nothing is left in the whole list.
 */
export function nextUnseen(
  tagGroups: TagGroups,
  cursor: ReviewCursor | null,
  unseen: (candidate: ElementChange) => boolean,
): ReviewCursor | undefined {
  const items = listedItems(tagGroups)
  const at = indexOfItem(items, cursor)
  const item = items[at]
  if (cursor?.on === 'row' && item) {
    const key = changeKey(cursor.changes[0])
    const member = wrappedAfter(
      item,
      item.findIndex((change) => changeKey(change) === key),
    ).find(unseen)
    if (member) return { on: 'row', changes: [member] }
  }
  const step = wrappedAfter(items, at)
    .filter(isStep)
    .find((candidate) => candidate.some(unseen))
  return step && cursorOnStep(step)
}

/** From a group into its first unseen member, or its first member when all are seen. */
export function stepInto(
  cursor: ReviewCursor | null,
  unseen: (candidate: ElementChange) => boolean,
): ReviewCursor | undefined {
  if (cursor?.on !== 'group') return undefined
  return { on: 'row', changes: [cursor.changes.find(unseen) ?? cursor.changes[0]] }
}

/** From a group member back to its group; anywhere else there is nothing to step out to. */
export function stepOut(tagGroups: TagGroups, cursor: ReviewCursor | null) {
  if (cursor?.on !== 'row') return undefined
  const items = listedItems(tagGroups)
  const item = items[indexOfItem(items, cursor)]
  return item && item.length > 1 ? cursorOnStep(item) : undefined
}

/**
 * The Changes list's sections, rows and group codes. The same inputs (by identity) return the same
 * result. Flagged and unflagged builds of one adiff group identically, so the list and the map
 * agree on every code.
 */
export function tagGroupsOf(changes: ElementChange[], areas: readonly WorkArea[]): TagGroups {
  let byAreas = cache.get(changes)
  if (!byAreas) {
    byAreas = new WeakMap()
    cache.set(changes, byAreas)
  }
  let groups = byAreas.get(areas)
  if (!groups) {
    groups = computeTagGroups(changes, areas)
    byAreas.set(areas, groups)
  }
  return groups
}
