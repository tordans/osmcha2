import type { NonEmptyArray } from '../../utils/nonEmptyArray.ts'
import { isOsmElementType, type OsmElementType } from '../../utils/osmElement.ts'
import { clusterChangesBySpace } from './changeGroupClusters.ts'
import { minorMoveOf } from './minorMoves.ts'
import { diffTags, type TagRow } from './tagRows.ts'
import { orderByConnectivity } from './wayChains.ts'
import { detectWayMerges, detectWaySplits, wayKey } from './waySplits.ts'

export type AdiffElement = {
  type?: string
  id?: number
  version?: number
  lat?: number
  lon?: number
  tags?: Record<string, string>
  nodes?: Array<{ ref?: number; lon?: number; lat?: number } | number>
  members?: Array<Record<string, any>>
}

export type AdiffAction = {
  type?: string
  old?: AdiffElement
  new?: AdiffElement
}

/** Augmented diff as returned by `@osmcha/osm-adiff-parser`. */
export type ParsedAdiff = {
  actions: AdiffAction[]
  note?: string
}

export type NamedReason = { id?: number; name?: string }

export type FlaggedFeature = {
  osm_id?: number
  name?: string
  note?: string
  reasons?: number[] | NamedReason[]
  user_flag?: string
  type?: string
  id?: number
  url?: string
}

export type NodeStats = { added: number; modified: number; deleted: number }

export type ElementFlag = {
  name?: string
  note?: string
  userFlag?: string
  reasons: string[]
}

export type LonLat = { lon: number; lat: number }

/** Where a way lies, taken from the node coordinates of its current version (old version when deleted). */
export type WayShape = {
  /** Node refs in way order. */
  refs: number[]
  /** First node = last node, with at least 4 nodes. */
  closed: boolean
  /** First and last node, when their coordinates are known. */
  first?: LonLat
  last?: LonLat
  /** Box around all nodes with known coordinates. */
  bounds?: { minLon: number; minLat: number; maxLon: number; maxLat: number }
}

export type MemberRoleChange = { type: string; ref: number; from: string; to: string }

export type MemberChanges = {
  roles: MemberRoleChange[]
  added: number
  removed: number
  /** The members both versions have now come in another order. */
  reordered: boolean
}

export type ElementChange = {
  actionType: 'create' | 'modify' | 'delete'
  type: OsmElementType
  id: number
  version?: number
  tags: TagRow[]
  nodeStats?: NodeStats
  geometry?: 'moved' | 'rewritten' | null
  /** Modified way whose direction flipped. `reshaped`: it also gained, lost or reordered nodes. */
  reversed?: { reshaped: boolean }
  /**
   * Needs no review, so it counts as seen unless the reviewer un-sees it: moved a tiny bit (see
   * `minorMoveOf`), or a relation that only swapped forward/backward roles of ways reversed in the
   * same changeset (see `followsReversal`).
   */
  minorMove?: { meters: number; roleFlips?: never } | { roleFlips: number; meters?: never }
  /** Relations: what changed in the member list. Absent when the members are the same. */
  memberChanges?: MemberChanges
  flagged?: ElementFlag
  lat?: number
  lon?: number
  /** Ways only: nodes and extent, used to group edits that sit in one place. */
  wayShape?: WayShape
  /** Created way: id of the modified way it was split from. `tags` are then diffed against that way's old tags. */
  splitFrom?: number
  /** Modified way: ids of the created ways split off it. */
  splitInto?: number[]
  /** Deleted way: id of the modified way it was merged into. `tags` are then diffed against that way's new tags. */
  mergedInto?: number
  /** Modified way: ids of the deleted ways merged into it. */
  mergedFrom?: number[]
}

export const ACTION_ORDER = ['create', 'modify', 'delete'] as const

function isElementActionType(value: string | undefined): value is ElementChange['actionType'] {
  return value === 'create' || value === 'modify' || value === 'delete'
}

function isNumberReasons(reasons: number[] | NamedReason[]): reasons is number[] {
  return typeof reasons[0] === 'number'
}

function tagsOf(element?: AdiffElement): Record<string, string> {
  return element?.tags ?? {}
}

function hasOwnTags(action: AdiffAction): boolean {
  return Object.keys(tagsOf(action.old)).length > 0 || Object.keys(tagsOf(action.new)).length > 0
}

export function currentElement(action: AdiffAction): AdiffElement | undefined {
  return action.new ?? action.old
}

export function isNoopAction(action: AdiffAction): boolean {
  if (action.type === 'noop') return true
  if (action.type !== 'modify') return false
  if (action.old?.version !== action.new?.version) return false
  // Same-version ways are still reviewable when member geometry changed
  // (OSM does not bump a way’s version when only its nodes move).
  return !wayMemberGeometryChanged(action)
}

type WayNode = { ref?: number; lon?: number; lat?: number }

function asWayNode(node: WayNode | number): WayNode {
  return typeof node === 'number' ? { ref: node } : node
}

function nodeRef(node: WayNode | number): number | undefined {
  return asWayNode(node).ref
}

function wayNodes(element?: AdiffElement): WayNode[] {
  return (element?.nodes ?? []).map(asWayNode)
}

function lonLatOf(node?: WayNode): LonLat | undefined {
  if (node?.lon == null || node.lat == null) return undefined
  return Number.isFinite(node.lon) && Number.isFinite(node.lat)
    ? { lon: node.lon, lat: node.lat }
    : undefined
}

function wayShape(element?: AdiffElement): WayShape {
  const nodes = wayNodes(element)
  const refs: number[] = []
  let bounds: WayShape['bounds']
  for (const node of nodes) {
    if (node.ref != null) refs.push(node.ref)
    const at = lonLatOf(node)
    if (!at) continue
    bounds = bounds
      ? {
          minLon: Math.min(bounds.minLon, at.lon),
          minLat: Math.min(bounds.minLat, at.lat),
          maxLon: Math.max(bounds.maxLon, at.lon),
          maxLat: Math.max(bounds.maxLat, at.lat),
        }
      : { minLon: at.lon, minLat: at.lat, maxLon: at.lon, maxLat: at.lat }
  }
  return {
    refs,
    closed: nodes.length >= 4 && refs.length === nodes.length && refs[0] === refs[refs.length - 1],
    first: lonLatOf(nodes[0]),
    last: lonLatOf(nodes[nodes.length - 1]),
    bounds,
  }
}

function wayNodeRefs(element?: AdiffElement): Set<number> {
  const refs = new Set<number>()
  for (const node of element?.nodes ?? []) {
    const ref = nodeRef(node)
    if (ref != null) refs.add(ref)
  }
  return refs
}

export function tagRows(action: AdiffAction): TagRow[] {
  return diffTags(tagsOf(action.old), tagsOf(action.new))
}

/** Tags of a way split off `parent`, compared with the parent's tags before the split. */
export function splitTagRows(parent: AdiffAction, child: AdiffAction): TagRow[] {
  return diffTags(tagsOf(parent.old), tagsOf(child.new))
}

/** A way merged into another: its old tags against the merged way's new tags. */
export function mergedTagRows(part: AdiffAction, survivor: AdiffAction): TagRow[] {
  return diffTags(tagsOf(part.old), tagsOf(survivor.new))
}

export function nodeMoved(action: AdiffAction): boolean {
  return (
    action.type === 'modify' &&
    action.new?.type === 'node' &&
    (action.new.lon !== action.old?.lon || action.new.lat !== action.old?.lat)
  )
}

export function wayRewritten(action: AdiffAction): boolean {
  if (action.type !== 'modify' || action.new?.type !== 'way') return false
  // In order and with repeats: closing a line repeats its first node, a Set would hide that.
  const oldRefs = orderedNodeRefs(action.old)
  const newRefs = orderedNodeRefs(action.new)
  if (oldRefs.length !== newRefs.length) return true
  return oldRefs.some((ref, index) => ref !== newRefs[index])
}

function orderedNodeRefs(element?: AdiffElement): number[] {
  return (element?.nodes ?? []).flatMap((node) => {
    const ref = nodeRef(node)
    return ref == null ? [] : [ref]
  })
}

/**
 * Whether a modified way now runs the other way round: the nodes it kept appear in reverse order
 * (for a closed way: in reverse order around the ring). `null` when the direction did not flip.
 */
export function wayReversal(action: AdiffAction): ElementChange['reversed'] | null {
  if (action.type !== 'modify' || action.new?.type !== 'way') return null
  const oldRefs = orderedNodeRefs(action.old)
  const newRefs = orderedNodeRefs(action.new)
  const closed =
    oldRefs.length > 3 && oldRefs[0] === oldRefs.at(-1) && newRefs[0] === newRefs.at(-1)
  const oldRing = closed ? oldRefs.slice(0, -1) : oldRefs
  const newRing = closed ? newRefs.slice(0, -1) : newRefs
  const oldIndex = new Map<number, number>()
  oldRing.forEach((ref, index) => {
    if (!oldIndex.has(ref)) oldIndex.set(ref, index)
  })
  const kept = [...new Set(newRing.filter((ref) => oldIndex.has(ref)))].flatMap(
    (ref) => oldIndex.get(ref) ?? [],
  )
  if (kept.length < (closed ? 3 : 2)) return null
  // Open: every kept node comes before the previous one. Closed: the same, except once where
  // the ring wraps around.
  const ascents = kept.filter((index, at) => {
    const next = closed ? kept[(at + 1) % kept.length] : kept[at + 1]
    return next != null && next > index
  }).length
  if (ascents > (closed ? 1 : 0)) return null
  const sameNodes =
    oldRefs.length === newRefs.length &&
    kept.length === oldIndex.size &&
    newRing.every((ref) => oldIndex.has(ref))
  return { reshaped: !sameNodes }
}

type Member = { type: string; ref: number; role: string }

function membersOf(element?: AdiffElement): Member[] {
  return (element?.members ?? []).flatMap((member) => {
    const ref = Number(member.ref)
    return typeof member.type === 'string' && Number.isFinite(ref)
      ? [{ type: member.type, ref, role: typeof member.role === 'string' ? member.role : '' }]
      : []
  })
}

/**
 * How a modified relation's members changed: roles that changed on a member it kept, members
 * added or removed, and whether the kept members came in another order. `undefined` when the
 * member list is the same. A member listed twice is matched by its position among its repeats.
 */
export function relationMemberChanges(action: AdiffAction): MemberChanges | undefined {
  if (action.type !== 'modify' || action.new?.type !== 'relation') return undefined
  const keyed = (members: Member[]) => {
    const seen = new Map<string, number>()
    return members.map((member) => {
      const base = `${member.type}/${member.ref}`
      const repeat = seen.get(base) ?? 0
      seen.set(base, repeat + 1)
      return { ...member, key: `${base}#${repeat}` }
    })
  }
  const before = keyed(membersOf(action.old))
  const after = keyed(membersOf(action.new))
  const beforeByKey = new Map(before.map((member) => [member.key, member]))
  const afterKeys = new Set(after.map((member) => member.key))
  const roles = after.flatMap((member) => {
    const old = beforeByKey.get(member.key)
    return old && old.role !== member.role
      ? [{ type: member.type, ref: member.ref, from: old.role, to: member.role }]
      : []
  })
  const added = after.filter((member) => !beforeByKey.has(member.key)).length
  const removed = before.filter((member) => !afterKeys.has(member.key)).length
  const keptBefore = before.filter((member) => afterKeys.has(member.key)).map((m) => m.key)
  const keptAfter = after.filter((member) => beforeByKey.has(member.key)).map((m) => m.key)
  const reordered = keptBefore.some((key, index) => key !== keptAfter[index])
  if (roles.length === 0 && added === 0 && removed === 0 && !reordered) return undefined
  return { roles, added, removed, reordered }
}

const FLIPPED_ROLE: Record<string, string> = { forward: 'backward', backward: 'forward' }

/**
 * Whether the member changes only follow from ways reversed in this changeset: iD swaps a way's
 * forward/backward role in every route relation when it reverses the way.
 */
export function followsReversal(changes: MemberChanges, reversedWayIds: ReadonlySet<number>) {
  return (
    changes.added === 0 &&
    changes.removed === 0 &&
    !changes.reordered &&
    changes.roles.length > 0 &&
    changes.roles.every(
      (role) =>
        role.type === 'way' && reversedWayIds.has(role.ref) && FLIPPED_ROLE[role.from] === role.to,
    )
  )
}

export function wayMemberGeometryChanged(action: AdiffAction): boolean {
  if (action.new?.type !== 'way' && action.old?.type !== 'way') return false
  if (wayRewritten(action)) return true
  const oldNodes = wayNodes(action.old)
  const newNodes = wayNodes(action.new)
  if (oldNodes.length !== newNodes.length) return true
  return oldNodes.some((node, index) => {
    const next = newNodes[index]
    return node.lon !== next?.lon || node.lat !== next?.lat
  })
}

export function wayMoved(action: AdiffAction): boolean {
  return (
    action.type === 'modify' &&
    action.new?.type === 'way' &&
    !wayRewritten(action) &&
    wayMemberGeometryChanged(action)
  )
}

function geometryChip(action: AdiffAction): ElementChange['geometry'] {
  if (nodeMoved(action)) return 'moved'
  if (wayRewritten(action)) return 'rewritten'
  if (wayMoved(action)) return 'moved'
  return null
}

function featureUrl(type: string, id: number): string {
  return `${type}-${id}`
}

export function matchFlaggedFeature(
  type: string,
  id: number,
  features: FlaggedFeature[],
): FlaggedFeature | undefined {
  const url = featureUrl(type, id)
  return features.find((feature) => {
    if (feature.url === url || feature.url === `${type}/${id}`) return true
    const osmId = feature.osm_id ?? (feature.type ? feature.id : undefined)
    if (feature.type === type && osmId === id) return true
    // Without type and url, the id is all there is; with a url, the url above decided.
    if (!feature.type && !feature.url && feature.osm_id === id) return true
    return false
  })
}

function reasonNames(feature: FlaggedFeature, changesetReasons: NamedReason[]): string[] {
  const names: string[] = []
  if (!feature.reasons?.length) return names
  if (isNumberReasons(feature.reasons)) {
    const ids = new Set(feature.reasons)
    for (const reason of changesetReasons) {
      if (reason.id != null && ids.has(reason.id) && reason.name) names.push(reason.name)
    }
    return names
  }
  for (const reason of feature.reasons) {
    if (reason.name) names.push(reason.name)
  }
  return names
}

export function mergeFlaggedFeatures(
  features: FlaggedFeature[],
  reviewedFeatures: Array<{ id?: string; user?: string }> = [],
): FlaggedFeature[] {
  const reviewed: FlaggedFeature[] = reviewedFeatures.map((feature) => ({
    url: feature.id,
    user_flag: feature.user ? `Flagged by ${feature.user}` : undefined,
    osm_id: feature.id ? Number.parseInt(feature.id.split('-')[1] ?? '', 10) : undefined,
    type: feature.id?.split('-')[0],
    reasons: [],
  }))
  const byUrl = new Map(features.map((feature) => [feature.url, { ...feature }]))
  for (const extra of reviewed) {
    if (!extra.url) continue
    const existing = byUrl.get(extra.url)
    if (existing) {
      existing.user_flag = extra.user_flag
    } else {
      byUrl.set(extra.url, extra)
    }
  }
  return [...byUrl.values(), ...features.filter((feature) => !feature.url)]
}

function emptyNodeStats(): NodeStats {
  return { added: 0, modified: 0, deleted: 0 }
}

/** Create/modify/delete counts per node id, so each way sums its own nodes without rescanning every action. */
function nodeActionStats(actions: AdiffAction[]): Map<number, NodeStats> {
  const byNode = new Map<number, NodeStats>()
  for (const action of actions) {
    if (isNoopAction(action) || !isElementActionType(action.type)) continue
    const element = currentElement(action)
    if (element?.type !== 'node' || element.id == null) continue
    let stats = byNode.get(element.id)
    if (!stats) {
      stats = emptyNodeStats()
      byNode.set(element.id, stats)
    }
    switch (action.type) {
      case 'create':
        stats.added += 1
        break
      case 'modify':
        stats.modified += 1
        break
      case 'delete':
        stats.deleted += 1
        break
    }
  }
  return byNode
}

function countWayNodeStats(wayAction: AdiffAction, byNode: Map<number, NodeStats>): NodeStats {
  const refs = new Set([...wayNodeRefs(wayAction.old), ...wayNodeRefs(wayAction.new)])
  const stats = emptyNodeStats()
  for (const ref of refs) {
    const node = byNode.get(ref)
    if (!node) continue
    stats.added += node.added
    stats.modified += node.modified
    stats.deleted += node.deleted
  }
  return stats
}

function wayMemberNodeIds(actions: AdiffAction[]): Set<number> {
  const ids = new Set<number>()
  for (const action of actions) {
    if (isNoopAction(action) || !isElementActionType(action.type)) continue
    if (action.new?.type !== 'way' && action.old?.type !== 'way') continue
    for (const ref of wayNodeRefs(action.old)) ids.add(ref)
    for (const ref of wayNodeRefs(action.new)) ids.add(ref)
  }
  return ids
}

function shouldListAction(action: AdiffAction, wayMemberNodes: Set<number>): boolean {
  if (isNoopAction(action) || !isElementActionType(action.type)) return false
  const element = currentElement(action)
  if (!element?.type || element.id == null) return false
  if (element.type === 'node' && wayMemberNodes.has(element.id) && !hasOwnTags(action)) {
    return false
  }
  return true
}

const NO_ACTIONS: AdiffAction[] = []
const NO_FLAGGED: FlaggedFeature[] = []
const NO_REASONS: NamedReason[] = []
/** Last few results per adiff: the list, the phone card and the map ask for the same changes. */
const changesCache = new WeakMap<
  AdiffAction[],
  Array<{
    flaggedFeatures: FlaggedFeature[]
    changesetReasons: NamedReason[]
    changes: ElementChange[]
  }>
>()
const CHANGES_CACHE_SIZE = 4

/**
 * The same inputs (by identity) return the same change objects, so a row of the Changes list sees
 * unchanged props and skips re-rendering. Callers must not mutate the result.
 */
export function buildElementChanges(
  actions: AdiffAction[] = NO_ACTIONS,
  flaggedFeatures: FlaggedFeature[] = NO_FLAGGED,
  changesetReasons: NamedReason[] = NO_REASONS,
): ElementChange[] {
  const entries = changesCache.get(actions) ?? []
  const hit = entries.find(
    (entry) =>
      entry.flaggedFeatures === flaggedFeatures && entry.changesetReasons === changesetReasons,
  )
  if (hit) return hit.changes
  const changes = computeElementChanges(actions, flaggedFeatures, changesetReasons)
  changesCache.set(
    actions,
    [{ flaggedFeatures, changesetReasons, changes }, ...entries].slice(0, CHANGES_CACHE_SIZE),
  )
  return changes
}

function computeElementChanges(
  actions: AdiffAction[],
  flaggedFeatures: FlaggedFeature[],
  changesetReasons: NamedReason[],
): ElementChange[] {
  const wayMemberNodes = wayMemberNodeIds(actions)
  const statsByNode = nodeActionStats(actions)
  const { parentByChild, childrenByParent } = detectWaySplits(actions)
  const { survivorByPart, partsBySurvivor } = detectWayMerges(actions)
  const reversalByWay = new Map(
    actions.flatMap((action) => {
      const reversal = action.new?.type === 'way' ? wayReversal(action) : null
      return reversal && action.new?.id != null ? [[action.new.id, reversal] as const] : []
    }),
  )
  const reversedWayIds = new Set(reversalByWay.keys())
  const parentActions = new Map<number, AdiffAction>()
  const survivorActions = new Map<number, AdiffAction>()
  for (const action of actions) {
    const wayId = action.type === 'modify' && action.old?.type === 'way' ? action.old.id : undefined
    if (wayId == null) continue
    if (childrenByParent.has(wayId)) parentActions.set(wayId, action)
    if (partsBySurvivor.has(wayId)) survivorActions.set(wayId, action)
  }
  const changes: ElementChange[] = []

  for (const action of actions) {
    if (!shouldListAction(action, wayMemberNodes)) continue
    const element = currentElement(action)
    if (!element?.type || element.id == null) continue
    if (!isOsmElementType(element.type) || !isElementActionType(action.type)) continue
    const type = element.type
    const flagged = matchFlaggedFeature(type, element.id, flaggedFeatures)
    const nodeStats = type === 'way' ? countWayNodeStats(action, statsByNode) : undefined
    const splitFrom = type === 'way' ? parentByChild.get(wayKey(element.id)) : undefined
    const splitParent = splitFrom != null ? parentActions.get(splitFrom) : undefined
    const splitInto =
      type === 'way' && action.type === 'modify' ? childrenByParent.get(element.id) : undefined

    const mergedInto =
      type === 'way' && action.type === 'delete'
        ? survivorByPart.get(wayKey(element.id))
        : undefined
    const survivor = mergedInto != null ? survivorActions.get(mergedInto) : undefined
    const mergedFrom =
      type === 'way' && action.type === 'modify' ? partsBySurvivor.get(element.id) : undefined

    const tags = splitParent
      ? splitTagRows(splitParent, action)
      : survivor
        ? mergedTagRows(action, survivor)
        : tagRows(action)
    const geometry = geometryChip(action)
    const tagsChanged = tagMutationRows(tags).length > 0
    const memberChanges = type === 'relation' ? relationMemberChanges(action) : undefined

    changes.push({
      actionType: action.type,
      type,
      id: element.id,
      version: element.version,
      tags,
      nodeStats,
      geometry,
      reversed: type === 'way' ? reversalByWay.get(element.id) : undefined,
      minorMove:
        memberChanges && !tagsChanged && followsReversal(memberChanges, reversedWayIds)
          ? { roleFlips: memberChanges.roles.length }
          : minorMoveOf(action, { geometry, tagsChanged }),
      memberChanges,
      flagged: flagged
        ? {
            name: flagged.name,
            note: flagged.note,
            userFlag: flagged.user_flag,
            reasons: reasonNames(flagged, changesetReasons),
          }
        : undefined,
      lat: element.lat ?? action.old?.lat,
      lon: element.lon ?? action.old?.lon,
      wayShape: type === 'way' ? wayShape(element) : undefined,
      splitFrom: splitParent ? splitFrom : undefined,
      splitInto,
      mergedInto: survivor ? mergedInto : undefined,
      mergedFrom,
    })
  }

  return changes
}

export function groupElementChanges(
  changes: ElementChange[],
): Array<[(typeof ACTION_ORDER)[number], ElementChange[]]> {
  return ACTION_ORDER.flatMap((actionType) => {
    const items = changes.filter((change) => change.actionType === actionType)
    return items.length > 0
      ? [[actionType, items] as [(typeof ACTION_ORDER)[number], ElementChange[]]]
      : []
  })
}

export type TagMutation = Exclude<TagRow, { kind: 'unchanged' }>

export function tagMutationRows(tags: TagRow[]): TagMutation[] {
  return tags.filter((row): row is TagMutation => row.kind !== 'unchanged')
}

/** The one tag change worth a glance: `name` when it changed (or was renamed to), else the first change. */
export function primaryTagMutation(tags: TagRow[]): TagMutation | null {
  const mutations = tagMutationRows(tags)
  return mutations.find((row) => row.key === 'name') ?? mutations[0] ?? null
}

function mutationTuple(row: TagMutation): [string, string, string, string?] {
  if (row.kind === 'changed') return ['changed', row.key, row.oldValue, row.newValue]
  if (row.kind === 'renamed') return ['renamed', row.key, row.oldKey, row.value]
  return [row.kind, row.key, row.value]
}

export function tagMutationKey(tags: TagRow[]): string {
  return JSON.stringify(
    tagMutationRows(tags)
      .map(mutationTuple)
      .sort((left, right) => left[1].localeCompare(right[1]) || left[0].localeCompare(right[0])),
  )
}

/**
 * Group elements that share the same added/removed/changed tags (unchanged tags ignored) and sit
 * in one place (see `clusterChangesBySpace`). Elements with no tag mutations stay ungrouped. They
 * are not "the same tag changes". Groups follow the order of their first member; the ways
 * inside a group follow the street (see `orderByConnectivity`).
 */
export function groupChangesByTagMutation(
  changes: ElementChange[],
): NonEmptyArray<ElementChange>[] {
  const indicesByKey = new Map<string, number[]>()
  let ungrouped = 0
  changes.forEach((change, index) => {
    const key =
      tagMutationRows(change.tags).length === 0
        ? `__ungrouped:${ungrouped++}`
        : `${change.splitFrom != null ? 'split:' : change.mergedInto != null ? 'merge:' : ''}${tagMutationKey(change.tags)}`
    const indices = indicesByKey.get(key)
    if (indices) indices.push(index)
    else indicesByKey.set(key, [index])
  })

  const groupKeyByIndex: string[] = []
  for (const [key, indices] of indicesByKey) {
    const labels =
      indices.length === 1
        ? [0]
        : clusterChangesBySpace(indices.flatMap((index) => changes[index] ?? []))
    indices.forEach((index, position) => {
      groupKeyByIndex[index] = `${key}#${labels[position]}`
    })
  }

  const groups = new Map<string, NonEmptyArray<ElementChange>>()
  changes.forEach((change, index) => {
    const key = groupKeyByIndex[index] ?? String(index)
    const group = groups.get(key)
    if (group) group.push(change)
    else groups.set(key, [change])
  })
  return [...groups.values()].map(orderByConnectivity)
}
