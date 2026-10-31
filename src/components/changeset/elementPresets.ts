// The preset iD would show for an object of the Changes list, from the tags of its rows. Kept apart from
// `buildElementChanges`, so that the list works before the preset data has arrived.
import type { PresetMatcher } from '../../presets/matcher.ts'
import type { Geometry, LonLat, Preset, Tags } from '../../presets/types.ts'
import type { AdiffAction, ElementChange, TagRow } from './changesetElements.ts'

type Side = 'old' | 'new'

/** What the adiff says about the surroundings of an object, as iD's graph would. */
export type PresetContext = {
  /**
   * Nodes that are members of a way, in the old and the new state: iD's `vertex` geometry (`graph.isPoi`
   * is false). Members of an address interpolation line are left out: iD matches those as points (#3241).
   */
  vertexNodes: Record<Side, ReadonlySet<number>>
  /** Ways whose first and last node are the same node, in the old and the new state. */
  closedWays: Record<Side, ReadonlySet<number>>
}

const NO_ACTIONS: AdiffAction[] = []
const EMPTY_CONTEXT: PresetContext = {
  vertexNodes: { old: new Set(), new: new Set() },
  closedWays: { old: new Set(), new: new Set() },
}
const contextCache = new WeakMap<AdiffAction[], PresetContext>()

function nodeRefsOf(nodes: NonNullable<AdiffAction['new']>['nodes']) {
  const refs: number[] = []
  for (const node of nodes ?? []) {
    const ref = typeof node === 'number' ? node : node.ref
    if (ref != null) refs.push(ref)
  }
  return refs
}

/**
 * Collects the way membership and closed ways of both states from all actions of the adiff, the
 * unchanged (noop) ones too. The same actions (by identity) return the same context.
 */
export function presetContextOf(actions: AdiffAction[] = NO_ACTIONS): PresetContext {
  if (actions === NO_ACTIONS) return EMPTY_CONTEXT
  const cached = contextCache.get(actions)
  if (cached) return cached
  const members = { old: new Set<number>(), new: new Set<number>() }
  const onAddressLines = { old: new Set<number>(), new: new Set<number>() }
  const closedWays = { old: new Set<number>(), new: new Set<number>() }
  for (const action of actions) {
    for (const side of ['old', 'new'] as const) {
      const way = action[side]
      if (way?.type !== 'way' || way.id == null) continue
      const refs = nodeRefsOf(way.nodes)
      // iD's isClosed
      if (refs.length > 1 && refs[0] === refs[refs.length - 1]) closedWays[side].add(way.id)
      const tags = way.tags ?? {}
      // iD: an address line is a way with addr:interpolation that is not an area (a closed one with an
      // area key besides is not told apart here)
      const target =
        tags['addr:interpolation'] !== undefined && tags.area !== 'yes'
          ? onAddressLines[side]
          : members[side]
      for (const ref of refs) target.add(ref)
    }
  }
  for (const side of ['old', 'new'] as const) {
    for (const ref of onAddressLines[side]) members[side].delete(ref)
  }
  const context: PresetContext = { vertexNodes: members, closedWays }
  contextCache.set(actions, context)
  return context
}

/** The tags of one state of an object, put together from the rows of its tag diff. */
export function tagsOfRows(rows: readonly TagRow[], side: Side): Tags {
  const tags: Tags = {}
  for (const row of rows) {
    switch (row.kind) {
      case 'unchanged':
        tags[row.key] = row.value
        break
      case 'added':
        if (side === 'new') tags[row.key] = row.value
        break
      case 'removed':
        if (side === 'old') tags[row.key] = row.value
        break
      case 'changed':
        tags[row.key] = side === 'new' ? row.newValue : row.oldValue
        break
      case 'renamed':
        tags[side === 'new' ? row.key : row.oldKey] = row.value
        break
    }
  }
  return tags
}

/** Where iD would look for the preset's location set: a node's coordinate, the center of a way's extent. */
export function locationOf(change: ElementChange): LonLat | undefined {
  if (change.type === 'node') {
    return change.lon != null && change.lat != null ? [change.lon, change.lat] : undefined
  }
  const bounds = change.wayShape?.bounds
  if (change.type === 'way' && bounds) {
    // iD's extent.center()
    return [(bounds.minLon + bounds.maxLon) / 2, (bounds.minLat + bounds.maxLat) / 2]
  }
  return undefined
}

export type ChangePresets =
  | { status: 'ready'; old?: Preset; new?: Preset }
  /** Some preset depends on the place and the country borders are not loaded yet. */
  | { status: 'pending' }
  /** Some preset depends on the place and the object has no known place. */
  | { status: 'unknown' }

type Matched = Preset | 'pending' | 'unknown'

function matchSide(
  change: ElementChange,
  side: Side,
  tags: Tags,
  context: PresetContext,
  matcher: PresetMatcher,
  locationsReady: boolean,
): Matched {
  function matchAs(geometry: Geometry): Matched {
    if (!matcher.needsLocation(tags, geometry)) return matcher.match(tags, geometry)
    const loc = locationOf(change)
    if (!loc) return 'unknown'
    if (!locationsReady) return 'pending'
    return matcher.match(tags, geometry, loc)
  }

  switch (change.type) {
    case 'relation':
      // iD: a multipolygon is an area
      return matchAs(tags.type === 'multipolygon' ? 'area' : 'relation')
    case 'way': {
      const closed = context.closedWays[side].has(change.id)
      return matchAs(matcher.isArea(tags, closed) ? 'area' : 'line')
    }
    case 'node': {
      if (context.vertexNodes[side].has(change.id)) return matchAs('vertex')
      // No way of the adiff holds the node: a standalone point, or a vertex whose way is not in the
      // adiff (a tag change on a node does not touch its way). As a point, a crossing or traffic signals
      // match only the generic "Highway" or "Point"; as a vertex they match their own preset. So take
      // the vertex when its preset fits better (a higher score), else the point.
      const asPoint = matchAs('point')
      if (typeof asPoint === 'string') return asPoint
      const asVertex = matchAs('vertex')
      if (typeof asVertex === 'string') return asPoint
      return matcher.matchScore(asVertex, tags) > matcher.matchScore(asPoint, tags)
        ? asVertex
        : asPoint
    }
  }
}

type CacheEntry = {
  matcher: PresetMatcher
  context: PresetContext
  locationsReady: boolean
  result: ChangePresets
}
const resultCache = new WeakMap<ElementChange, CacheEntry>()

/**
 * The preset of the old and the new state of a change (a created object has only a new one, a deleted
 * one only an old one). The answer is cached per change until the context or the loaded data changes.
 */
export function presetsOfChange(
  change: ElementChange,
  context: PresetContext,
  matcher: PresetMatcher,
  locationsReady: boolean,
): ChangePresets {
  const cached = resultCache.get(change)
  if (
    cached &&
    cached.matcher === matcher &&
    cached.context === context &&
    cached.locationsReady === locationsReady
  ) {
    return cached.result
  }
  const wantOld = change.actionType !== 'create'
  const wantNew = change.actionType !== 'delete'
  const oldMatch = wantOld
    ? matchSide(change, 'old', tagsOfRows(change.tags, 'old'), context, matcher, locationsReady)
    : undefined
  const newMatch = wantNew
    ? matchSide(change, 'new', tagsOfRows(change.tags, 'new'), context, matcher, locationsReady)
    : undefined
  let result: ChangePresets
  if (oldMatch === 'unknown' || newMatch === 'unknown') result = { status: 'unknown' }
  else if (oldMatch === 'pending' || newMatch === 'pending') result = { status: 'pending' }
  else result = { status: 'ready', old: oldMatch, new: newMatch }
  resultCache.set(change, { matcher, context, locationsReady, result })
  return result
}

/** The preset a change shows: the new one, or for a deleted object the old one. */
function shownPreset(presets: Extract<ChangePresets, { status: 'ready' }>) {
  return presets.new ?? presets.old
}

/**
 * The line under an object's title. A generic fallback (Point, Line, Area, Relation) says only that no
 * preset knows the tags, and the title already says the type, so it is left out, except in `Old → New`,
 * where it tells that the object lost its type (or got one).
 */
export function presetLineOf(presets: ChangePresets, isFallback: (preset: Preset) => boolean) {
  if (presets.status !== 'ready') return undefined
  const { old, new: current } = presets
  if (old && current && old.id !== current.id && old.name !== current.name) {
    if (isFallback(old) && isFallback(current)) return undefined
    return `${old.name} → ${current.name}`
  }
  const preset = shownPreset(presets)
  return preset && !isFallback(preset) ? preset.name : undefined
}
