export type OsmElementType = 'node' | 'way' | 'relation'

export type AdiffElement = {
  type?: string
  id?: number
  version?: number
  lat?: number
  lon?: number
  tags?: Record<string, string>
  nodes?: Array<{ ref?: number } | number>
  members?: Array<Record<string, any>>
}

export type AdiffAction = {
  type?: string
  old?: AdiffElement
  new?: AdiffElement
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
  | { kind: 'unchanged'; key: string; value: string }

export type NodeStats = { added: number; modified: number; deleted: number }

export type ElementFlag = {
  name?: string
  note?: string
  userFlag?: string
  reasons: string[]
}

export type ElementChange = {
  actionType: 'create' | 'modify' | 'delete'
  type: OsmElementType
  id: number
  version?: number
  tags: TagRow[]
  nodeStats?: NodeStats
  geometry?: 'moved' | 'rewritten' | null
  flagged?: ElementFlag
  lat?: number
  lon?: number
}

export const ACTION_ORDER = ['create', 'modify', 'delete'] as const

const ACTION_TYPES = new Set<string>(ACTION_ORDER)

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
  return action.old?.version === action.new?.version
}

function nodeRef(node: { ref?: number } | number): number | undefined {
  if (typeof node === 'number') return node
  return node.ref
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
  const oldTags = tagsOf(action.old)
  const newTags = tagsOf(action.new)
  const rows: TagRow[] = []

  for (const [key, value] of Object.entries(newTags)) {
    if (!(key in oldTags)) {
      rows.push({ kind: 'added', key, value })
    } else if (oldTags[key] !== value) {
      rows.push({ kind: 'changed', key, oldValue: oldTags[key], newValue: value })
    } else {
      rows.push({ kind: 'unchanged', key, value })
    }
  }

  for (const [key, value] of Object.entries(oldTags)) {
    if (!(key in newTags)) {
      rows.push({ kind: 'removed', key, value })
    }
  }

  return rows
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

function geometryChip(action: AdiffAction): ElementChange['geometry'] {
  if (nodeMoved(action)) return 'moved'
  if (wayRewritten(action)) return 'rewritten'
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
  if (typeof feature.reasons[0] === 'number') {
    const ids = new Set(feature.reasons as number[])
    for (const reason of changesetReasons) {
      if (reason.id != null && ids.has(reason.id) && reason.name) names.push(reason.name)
    }
    return names
  }
  for (const reason of feature.reasons as NamedReason[]) {
    if (reason.name) names.push(reason.name)
  }
  return names
}

export function mergeFlaggedFeatures(
  features: FlaggedFeature[],
  reviewedFeatures: Array<{ id?: string; user?: string }> = [],
): FlaggedFeature[] {
  const reviewed = reviewedFeatures.map((feature) => ({
    url: feature.id,
    user_flag: feature.user ? `Flagged by ${feature.user}` : undefined,
    osm_id: feature.id ? Number.parseInt(feature.id.split('-')[1] ?? '', 10) : undefined,
    type: feature.id?.split('-')[0],
    reasons: [] as number[],
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

function countWayNodeStats(wayAction: AdiffAction, actions: AdiffAction[]): NodeStats {
  const refs = new Set([...wayNodeRefs(wayAction.old), ...wayNodeRefs(wayAction.new)])
  const stats = emptyNodeStats()
  if (refs.size === 0) return stats

  for (const action of actions) {
    if (isNoopAction(action) || !ACTION_TYPES.has(action.type ?? '')) continue
    const element = currentElement(action)
    if (element?.type !== 'node' || element.id == null || !refs.has(element.id)) continue
    if (action.type === 'create') stats.added += 1
    else if (action.type === 'modify') stats.modified += 1
    else if (action.type === 'delete') stats.deleted += 1
  }
  return stats
}

function wayMemberNodeIds(actions: AdiffAction[]): Set<number> {
  const ids = new Set<number>()
  for (const action of actions) {
    if (isNoopAction(action) || !ACTION_TYPES.has(action.type ?? '')) continue
    if (action.new?.type !== 'way' && action.old?.type !== 'way') continue
    for (const ref of wayNodeRefs(action.old)) ids.add(ref)
    for (const ref of wayNodeRefs(action.new)) ids.add(ref)
  }
  return ids
}

function shouldListAction(action: AdiffAction, wayMemberNodes: Set<number>): boolean {
  if (isNoopAction(action) || !ACTION_TYPES.has(action.type ?? '')) return false
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
  const changes: ElementChange[] = []

  for (const action of actions) {
    if (!shouldListAction(action, wayMemberNodes)) continue
    const element = currentElement(action)
    if (!element?.type || element.id == null) continue
    const type = element.type as OsmElementType
    const flagged = matchFlaggedFeature(type, element.id, flaggedFeatures)
    const nodeStats = type === 'way' ? countWayNodeStats(action, actions) : undefined

    changes.push({
      actionType: action.type as ElementChange['actionType'],
      type,
      id: element.id,
      version: element.version,
      tags: tagRows(action),
      nodeStats,
      geometry: geometryChip(action),
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

function mutationTuple(row: TagMutation): [string, string, string, string?] {
  if (row.kind === 'changed') return ['changed', row.key, row.oldValue, row.newValue]
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
 * Group elements that share the same added/removed/changed tags (unchanged tags ignored).
 * Elements with no tag mutations stay ungrouped — they are not “the same tag changes”.
 */
export function groupChangesByTagMutation(changes: ElementChange[]): ElementChange[][] {
  const groups = new Map<string, ElementChange[]>()
  let ungrouped = 0
  for (const change of changes) {
    const key =
      tagMutationRows(change.tags).length === 0
        ? `__ungrouped:${ungrouped++}`
        : tagMutationKey(change.tags)
    const group = groups.get(key)
    if (group) group.push(change)
    else groups.set(key, [change])
  }
  return [...groups.values()]
}
