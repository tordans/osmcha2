import type { NonEmptyArray } from '../../utils/nonEmptyArray.ts'
import type { ElementChange } from './changesetElements.ts'

/**
 * A group's ways in street order: each way follows one it shares a node with, so stepping
 * through the group walks along the street. A chain starts at an end, preferably where the
 * line direction begins. Pieces that do not touch form further chains, in the order their
 * first way had. Groups with anything but ways keep their order.
 */
export function orderByConnectivity(
  group: NonEmptyArray<ElementChange>,
): NonEmptyArray<ElementChange> {
  if (group.length < 2) return group
  const shapes = group.map((change) => (change.type === 'way' ? change.wayShape : undefined))
  if (shapes.some((shape) => !shape || shape.refs.length < 2)) return group

  const nodeSets = shapes.map((shape) => new Set(shape?.refs))
  // Ways by node, so finding the neighbours stays linear for groups of thousands of ways.
  const waysByRef = new Map<number, number[]>()
  shapes.forEach((shape, index) => {
    for (const ref of new Set(shape?.refs)) {
      const ways = waysByRef.get(ref)
      if (ways) ways.push(index)
      else waysByRef.set(ref, [index])
    }
  })
  const neighbors = shapes.map((shape, index) => {
    const touching = new Set<number>()
    for (const ref of shape?.refs ?? []) {
      for (const other of waysByRef.get(ref) ?? []) if (other !== index) touching.add(other)
    }
    return [...touching].sort((a, b) => a - b)
  })
  const firstRef = (index: number) => shapes[index]?.refs[0]
  const lastRef = (index: number) => shapes[index]?.refs.at(-1)
  // The way starts on a node another way of the group has: it is not where the street begins.
  const continuesAnother = (index: number) => {
    const ref = firstRef(index)
    return ref != null && (neighbors[index]?.some((other) => nodeSets[other]?.has(ref)) ?? false)
  }

  const visited = new Set<number>()
  const order: number[] = []
  while (order.length < group.length) {
    const open = group.flatMap((_, index) => (visited.has(index) ? [] : [index]))
    const degree = (index: number) =>
      neighbors[index]?.filter((other) => !visited.has(other)).length ?? 0
    const start =
      open.find((index) => degree(index) <= 1 && !continuesAnother(index)) ??
      open.find((index) => degree(index) <= 1) ??
      open[0]
    if (start == null) break
    let current: number | undefined = start
    while (current != null) {
      visited.add(current)
      order.push(current)
      const end = lastRef(current)
      const candidates: number[] = neighbors[current]?.filter((other) => !visited.has(other)) ?? []
      current =
        candidates.find((other) => firstRef(other) === end || lastRef(other) === end) ??
        candidates[0]
    }
  }
  const ordered = order.flatMap((index) => group[index] ?? [])
  const [first, ...rest] = ordered
  return first ? [first, ...rest] : group
}
