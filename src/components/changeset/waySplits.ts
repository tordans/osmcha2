import type { AdiffAction, AdiffElement } from './changesetElements.ts'

export type WaySplits = {
  /** `way/<id>` of a created way -> id of the modified way it was split from. */
  parentByChild: Map<string, number>
  /** Id of a modified way -> ids of the created ways split off it, in action order. */
  childrenByParent: Map<number, number[]>
}

/** Same key shape as `ElementChange` rows, so a lookup reads `parentByChild.get(`way/${id}`)`. */
export function wayKey(id: number): string {
  return `way/${id}`
}

/** Node refs in way order; entries without a ref (missing data) are dropped. */
function refList(element?: AdiffElement): number[] {
  const refs: number[] = []
  for (const node of element?.nodes ?? []) {
    const ref = typeof node === 'number' ? node : node.ref
    if (ref != null) refs.push(ref)
  }
  return refs
}

/** Only lines are considered: a ring (first node = last node) has no single contiguous run to cut out. */
function isClosedRing(refs: number[]): boolean {
  return refs.length >= 3 && refs[0] === refs[refs.length - 1]
}

type Parent = { id: number; oldRefs: number[]; newRefs: Set<number>; newCount: number }

/**
 * Longest run of `child` nodes that is also a contiguous run of `parentRefs`, walking the parent
 * forwards or backwards. Returns the shared nodes in child order.
 */
function longestSharedRun(child: number[], parentRefs: number[]): number[] {
  const positions = new Map<number, number[]>()
  parentRefs.forEach((ref, index) => {
    const list = positions.get(ref)
    if (list) list.push(index)
    else positions.set(ref, [index])
  })

  let best: number[] = []
  for (let start = 0; start < child.length; start++) {
    // A run cannot beat `best` when the rest of the child is already shorter.
    if (child.length - start <= best.length) break
    const startRef = child[start]
    if (startRef === undefined) continue
    for (const first of positions.get(startRef) ?? []) {
      for (const step of [1, -1]) {
        let length = 1
        while (
          start + length < child.length &&
          parentRefs[first + step * length] === child[start + length]
        ) {
          length += 1
        }
        if (length > best.length) best = child.slice(start, start + length)
      }
    }
  }
  return best
}

/**
 * Finds ways that were split in this changeset: a created way W' made of a contiguous run of the
 * old nodes of a modified way W, where W lost nodes. The one-parent-many-children case (split
 * into 3+ parts) falls out of matching each created way on its own.
 *
 * Limits: lines only. A created way or a modified way (old or new) that is a closed ring is
 * never matched. Missing node data means no detection. A child only counts the nodes it shares
 * with the parent's old node list; extra new nodes on the child are fine.
 */
export function detectWaySplits(actions: AdiffAction[] = []): WaySplits {
  const parentByChild = new Map<string, number>()
  const childrenByParent = new Map<number, number[]>()

  const parents: Parent[] = []
  const parentsByNode = new Map<number, Parent[]>()
  for (const action of actions) {
    if (action.type !== 'modify') continue
    const { old: before, new: after } = action
    if (before?.type !== 'way' || after?.type !== 'way' || before.id == null) continue
    const oldRefs = refList(before)
    const newRefs = refList(after)
    if (oldRefs.length < 2 || isClosedRing(oldRefs) || isClosedRing(newRefs)) continue
    const parent: Parent = {
      id: before.id,
      oldRefs,
      newRefs: new Set(newRefs),
      newCount: newRefs.length,
    }
    parents.push(parent)
    for (const ref of new Set(oldRefs)) {
      const list = parentsByNode.get(ref)
      if (list) list.push(parent)
      else parentsByNode.set(ref, [parent])
    }
  }
  if (parents.length === 0) return { parentByChild, childrenByParent }

  for (const action of actions) {
    if (action.type !== 'create' || action.new?.type !== 'way' || action.new.id == null) continue
    const childId = action.new.id
    const childRefs = refList(action.new)
    if (childRefs.length < 2 || isClosedRing(childRefs)) continue

    // Only ways that share a node with the child can be its parent.
    const candidates = new Set<Parent>()
    for (const ref of childRefs) {
      for (const parent of parentsByNode.get(ref) ?? []) candidates.add(parent)
    }

    let bestParent: Parent | undefined
    let bestShared = 0
    for (const parent of candidates) {
      const shared = longestSharedRun(childRefs, parent.oldRefs)
      if (shared.length < 2) continue
      const lostNodes =
        shared.some((ref) => !parent.newRefs.has(ref)) || parent.newCount < parent.oldRefs.length
      if (!lostNodes) continue
      if (
        shared.length > bestShared ||
        (shared.length === bestShared && parent.id < (bestParent?.id ?? Infinity))
      ) {
        bestParent = parent
        bestShared = shared.length
      }
    }
    if (!bestParent) continue

    parentByChild.set(wayKey(childId), bestParent.id)
    const siblings = childrenByParent.get(bestParent.id)
    if (siblings) siblings.push(childId)
    else childrenByParent.set(bestParent.id, [childId])
  }

  return { parentByChild, childrenByParent }
}

export type WayMerges = {
  /** `way/<id>` of a deleted way -> id of the modified way it was merged into. */
  survivorByPart: Map<string, number>
  /** Id of a modified way -> ids of the deleted ways merged into it, in action order. */
  partsBySurvivor: Map<number, number[]>
}

/**
 * Finds ways that were merged in this changeset, the reverse of a split: a deleted way D whose old
 * nodes all reappear, as one contiguous run, in the new nodes of a modified way W, where W gained
 * nodes it did not have before. iD's "Combine" keeps the oldest way and deletes the others.
 *
 * Limits: lines only, as for splits. All of D's nodes must be in W, so a deleted way that merely
 * touched W is no merge.
 */
export function detectWayMerges(actions: AdiffAction[] = []): WayMerges {
  const survivorByPart = new Map<string, number>()
  const partsBySurvivor = new Map<number, number[]>()

  type Survivor = { id: number; oldRefs: Set<number>; newRefs: number[] }
  const survivors: Survivor[] = []
  const survivorsByNode = new Map<number, Survivor[]>()
  for (const action of actions) {
    if (action.type !== 'modify') continue
    const { old: before, new: after } = action
    if (before?.type !== 'way' || after?.type !== 'way' || before.id == null) continue
    const oldRefs = refList(before)
    const newRefs = refList(after)
    if (newRefs.length <= oldRefs.length || isClosedRing(oldRefs) || isClosedRing(newRefs)) continue
    const survivor: Survivor = { id: before.id, oldRefs: new Set(oldRefs), newRefs }
    survivors.push(survivor)
    for (const ref of new Set(newRefs)) {
      const list = survivorsByNode.get(ref)
      if (list) list.push(survivor)
      else survivorsByNode.set(ref, [survivor])
    }
  }
  if (survivors.length === 0) return { survivorByPart, partsBySurvivor }

  for (const action of actions) {
    if (action.type !== 'delete' || action.old?.type !== 'way' || action.old.id == null) continue
    const partId = action.old.id
    const partRefs = refList(action.old)
    const firstRef = partRefs[0]
    if (firstRef === undefined || partRefs.length < 2 || isClosedRing(partRefs)) continue

    let match: Survivor | undefined
    for (const survivor of survivorsByNode.get(firstRef) ?? []) {
      const whole = longestSharedRun(partRefs, survivor.newRefs).length === partRefs.length
      const gained = partRefs.some((ref) => !survivor.oldRefs.has(ref))
      if (whole && gained && survivor.id < (match?.id ?? Infinity)) match = survivor
    }
    if (!match) continue

    survivorByPart.set(wayKey(partId), match.id)
    const parts = partsBySurvivor.get(match.id)
    if (parts) parts.push(partId)
    else partsBySurvivor.set(match.id, [partId])
  }

  return { survivorByPart, partsBySurvivor }
}
