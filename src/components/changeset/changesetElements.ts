import type { NonEmptyArray } from '../../utils/nonEmptyArray.ts'
import { clusterChangesBySpace } from './changeGroupClusters.ts'
import { minorMoveOf } from './minorMoves.ts'
import { detectWaySplits, wayKey } from './waySplits.ts'

export type OsmElementType = 'node' | 'way' | 'relation'

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

export type TagRow =
  | { kind: 'added'; key: string; value: string }
  | { kind: 'removed'; key: string; value: string }
  | { kind: 'changed'; key: string; oldValue: string; newValue: string }
  /** A removed and an added key with the same value, shown as one row. `key` is the new key. */
  | { kind: 'renamed'; oldKey: string; key: string; value: string }
  | { kind: 'unchanged'; key: string; value: string }

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

export type ElementChange = {
  actionType: 'create' | 'modify' | 'delete'
  type: OsmElementType
  id: number
  version?: number
  tags: TagRow[]
  nodeStats?: NodeStats
  geometry?: 'moved' | 'rewritten' | null
  /** Only moved a tiny bit (see `minorMoveOf`): counts as seen unless the reviewer un-sees it. */
  minorMove?: { meters: number }
  flagged?: ElementFlag
  lat?: number
  lon?: number
  /** Ways only: nodes and extent, used to group edits that sit in one place. */
  wayShape?: WayShape
  /** Created way: id of the modified way it was split from. `tags` are then diffed against that way's old tags. */
  splitFrom?: number
  /** Modified way: ids of the created ways split off it. */
  splitInto?: number[]
}

export const ACTION_ORDER = ['create', 'modify', 'delete'] as const

function isOsmElementType(value: string): value is OsmElementType {
  return value === 'node' || value === 'way' || value === 'relation'
}

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

function diffTags(oldRecord: Record<string, string>, newRecord: Record<string, string>): TagRow[] {
  // Maps, not plain objects: `in` would also match inherited keys such as "constructor".
  const oldTags = new Map(Object.entries(oldRecord))
  const newTags = new Map(Object.entries(newRecord))
  const rows: TagRow[] = []

  for (const [key, value] of newTags) {
    const oldValue = oldTags.get(key)
    if (oldValue === undefined) {
      rows.push({ kind: 'added', key, value })
    } else if (oldValue !== value) {
      rows.push({ kind: 'changed', key, oldValue, newValue: value })
    } else {
      rows.push({ kind: 'unchanged', key, value })
    }
  }

  for (const [key, value] of oldTags) {
    if (!newTags.has(key)) {
      rows.push({ kind: 'removed', key, value })
    }
  }

  return mergeKeyRenames(rows)
}

/** Share of matching letter pairs (Dice coefficient), 0 to 1. */
function keySimilarity(left: string, right: string): number {
  if (left === right) return 1
  if (left.length < 2 || right.length < 2) return 0
  const pairs = new Map<string, number>()
  for (let index = 0; index < left.length - 1; index++) {
    const pair = left.slice(index, index + 2)
    pairs.set(pair, (pairs.get(pair) ?? 0) + 1)
  }
  let shared = 0
  for (let index = 0; index < right.length - 1; index++) {
    const pair = right.slice(index, index + 2)
    const count = pairs.get(pair) ?? 0
    if (count > 0) {
      shared += 1
      pairs.set(pair, count - 1)
    }
  }
  return (2 * shared) / (left.length + right.length - 2)
}

/**
 * Merge a removed and an added tag with the identical value into one `renamed` row. With exactly
 * one of each for a value they always pair. With several, pairs go greedily by key similarity
 * (best first, ties by key) and need some similarity, so unrelated keys that merely share a value
 * such as "yes" stay added/removed. A tag whose value also changed is never a rename.
 */
function mergeKeyRenames(rows: TagRow[]): TagRow[] {
  const removedByValue = new Map<string, string[]>()
  const addedByValue = new Map<string, string[]>()
  for (const row of rows) {
    if (row.kind !== 'removed' && row.kind !== 'added') continue
    const byValue = row.kind === 'removed' ? removedByValue : addedByValue
    const keys = byValue.get(row.value)
    if (keys) keys.push(row.key)
    else byValue.set(row.value, [row.key])
  }

  const renamedTo = new Map<string, string>() // new key -> old key
  const renamedFrom = new Set<string>() // old keys that were merged
  for (const [value, removedKeys] of removedByValue) {
    const addedKeys = addedByValue.get(value)
    if (!addedKeys) continue
    if (removedKeys.length === 1 && addedKeys.length === 1) {
      const [oldKey] = removedKeys
      const [newKey] = addedKeys
      if (oldKey !== undefined && newKey !== undefined) {
        renamedTo.set(newKey, oldKey)
        renamedFrom.add(oldKey)
      }
      continue
    }
    const candidates = removedKeys
      .flatMap((oldKey) =>
        addedKeys.map((newKey) => ({ oldKey, newKey, score: keySimilarity(oldKey, newKey) })),
      )
      .filter((candidate) => candidate.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          compareKeys(left.newKey, right.newKey) ||
          compareKeys(left.oldKey, right.oldKey),
      )
    for (const { oldKey, newKey } of candidates) {
      if (renamedFrom.has(oldKey) || renamedTo.has(newKey)) continue
      renamedTo.set(newKey, oldKey)
      renamedFrom.add(oldKey)
    }
  }
  if (renamedTo.size === 0) return rows

  return rows.flatMap((row): TagRow[] => {
    if (row.kind === 'removed' && renamedFrom.has(row.key)) return []
    const oldKey = row.kind === 'added' ? renamedTo.get(row.key) : undefined
    if (row.kind === 'added' && oldKey !== undefined) {
      return [{ kind: 'renamed', oldKey, key: row.key, value: row.value }]
    }
    return [row]
  })
}

/** Plain code point order, so the result does not depend on the locale. */
function compareKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

const MUTATION_KIND_ORDER = ['renamed', 'changed', 'added', 'removed'] as const

/**
 * Tag rows for display: the rows with a change first (renamed, changed, added, removed; by key
 * within each), then the unchanged rows by key.
 */
export function orderTagRows<T extends { kind: TagRow['kind']; key: string }>(
  rows: T[],
): { mutations: T[]; unchanged: T[] } {
  const rank = (row: T) =>
    MUTATION_KIND_ORDER.indexOf(row.kind as (typeof MUTATION_KIND_ORDER)[number])
  return {
    mutations: rows
      .filter((row) => row.kind !== 'unchanged')
      .sort((left, right) => rank(left) - rank(right) || compareKeys(left.key, right.key)),
    unchanged: rows
      .filter((row) => row.kind === 'unchanged')
      .sort((left, right) => compareKeys(left.key, right.key)),
  }
}

/** Keys a row stands for: a renamed row also answers to the key it had before. */
export function tagRowKeys(row: { key: string; oldKey?: string }): string[] {
  return row.oldKey === undefined ? [row.key] : [row.key, row.oldKey]
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
  const oldRefs = [...wayNodeRefs(action.old)]
  const newRefs = [...wayNodeRefs(action.new)]
  if (oldRefs.length !== newRefs.length) return true
  return oldRefs.some((ref, index) => ref !== newRefs[index])
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
    if (!feature.type && feature.osm_id === id) return true
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

export function buildElementChanges(
  actions: AdiffAction[] = [],
  flaggedFeatures: FlaggedFeature[] = [],
  changesetReasons: NamedReason[] = [],
): ElementChange[] {
  const wayMemberNodes = wayMemberNodeIds(actions)
  const statsByNode = nodeActionStats(actions)
  const { parentByChild, childrenByParent } = detectWaySplits(actions)
  const parentActions = new Map<number, AdiffAction>()
  for (const action of actions) {
    const parentId =
      action.type === 'modify' && action.old?.type === 'way' ? action.old.id : undefined
    if (parentId != null && childrenByParent.has(parentId)) parentActions.set(parentId, action)
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

    const tags = splitParent ? splitTagRows(splitParent, action) : tagRows(action)
    const geometry = geometryChip(action)

    changes.push({
      actionType: action.type,
      type,
      id: element.id,
      version: element.version,
      tags,
      nodeStats,
      geometry,
      minorMove: minorMoveOf(action, { geometry, tagsChanged: tagMutationRows(tags).length > 0 }),
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
 * are not "the same tag changes". Groups follow the order of their first member.
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
        : `${change.splitFrom != null ? 'split:' : ''}${tagMutationKey(change.tags)}`
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
  return [...groups.values()]
}
