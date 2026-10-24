import type { AdiffAction } from '../components/changeset/changesetElements.ts'

/** Untagged way/area corner points. Drawn small and never hit-tested. */
const CHANGESET_NODE_VERTEX_BG_LAYER_ID = 'changeset-node-vertex-bg'
const CHANGESET_NODE_VERTEX_LAYER_ID = 'changeset-node-vertex'
/** Clickable points: tagged nodes and nodes that belong to no way. White ring like iD. */
const CHANGESET_NODE_POINT_BG_LAYER_ID = 'changeset-node-tagged-bg'
const CHANGESET_NODE_POINT_LAYER_ID = 'changeset-node-tagged'

const VIEWER_UNTAGGED_BG_LAYER_ID = 'changeset-node-untagged-bg'
const VIEWER_UNTAGGED_LAYER_ID = 'changeset-node-untagged'

export const CHANGESET_NODE_VERTEX_LAYER_IDS: string[] = [
  CHANGESET_NODE_VERTEX_BG_LAYER_ID,
  CHANGESET_NODE_VERTEX_LAYER_ID,
]

const POINT_RING_COLOR = '#ffffff'
const VERTEX_OPACITY = 0.6

type NodeLikeElement = {
  type?: string
  id?: number
  tags?: Record<string, string>
  nodes?: Array<{ ref?: number } | number>
}

function nodeRefsOf(element: NodeLikeElement | undefined): number[] {
  const refs: number[] = []
  for (const node of element?.nodes ?? []) {
    const ref = typeof node === 'number' ? node : node.ref
    if (ref != null) refs.push(ref)
  }
  return refs
}

function hasTags(element: NodeLikeElement | undefined): boolean {
  return Object.keys(element?.tags ?? {}).length > 0
}

/** Node ids that are a member of any way in the diff, old or new version. */
export function wayMemberNodeIds(actions: AdiffAction[]): Set<number> {
  const ids = new Set<number>()
  for (const action of actions) {
    for (const element of [action.old, action.new]) {
      if (element?.type !== 'way') continue
      for (const ref of nodeRefsOf(element)) ids.add(ref)
    }
  }
  return ids
}

/** Node ids that carry tags in the old or the new version. */
function taggedNodeIds(actions: AdiffAction[]): Set<number> {
  const ids = new Set<number>()
  for (const action of actions) {
    for (const element of [action.old, action.new]) {
      if (element?.type === 'node' && element.id != null && hasTags(element)) ids.add(element.id)
    }
  }
  return ids
}

/**
 * A node is worth a tap when it has tags or when no way in the diff uses it.
 * Untagged corner points of lines and areas are only context.
 */
export function isClickableNode(options: { hasTags: boolean; isWayMember: boolean }): boolean {
  return options.hasTags || !options.isWayMember
}

/** Adds `clickable` to every node feature. Both versions of one node share the value. */
export function annotateNodeClickability(
  geojson: GeoJSON.FeatureCollection,
  actions: AdiffAction[],
): GeoJSON.FeatureCollection {
  const wayMembers = wayMemberNodeIds(actions)
  const tagged = taggedNodeIds(actions)
  return {
    ...geojson,
    features: geojson.features.map((feature) => {
      const properties = feature.properties
      if (properties?.type !== 'node') return feature
      const id = properties.id as number
      const clickable = isClickableNode({
        hasTags: tagged.has(id) || Number(properties.num_tags ?? 0) > 0,
        isWayMember: wayMembers.has(id),
      })
      return { ...feature, properties: { ...properties, clickable } }
    }),
  }
}

type LayerLike = {
  id: string
  filter?: unknown
  paint?: Record<string, unknown>
}

/**
 * The viewer's last filter clause is the show-actions filter; keep it and swap the
 * tag-count clause for the `clickable` property. Legacy filter syntax only: mixing
 * it with expression clauses makes MapLibre misread the whole filter.
 */
function nodeFilter(layer: LayerLike, clickable: boolean): unknown[] {
  const actionFilter = Array.isArray(layer.filter) ? layer.filter.at(-1) : undefined
  return [
    'all',
    ['==', 'type', 'node'],
    ['==', 'clickable', clickable],
    ...(actionFilter ? [actionFilter] : []),
  ]
}

/**
 * Restyle the viewer's node layers: clickable points larger with a white ring, untagged
 * vertices small and pale without a ring. The viewer splits by tag count; we split by
 * `clickable` (see `annotateNodeClickability`).
 */
export function applyNodeClickabilityStyle<T extends LayerLike>(layers: T[]): T[] {
  return layers.map((layer) => {
    switch (layer.id) {
      case VIEWER_UNTAGGED_BG_LAYER_ID:
        return {
          ...layer,
          id: CHANGESET_NODE_VERTEX_BG_LAYER_ID,
          filter: nodeFilter(layer, false),
          paint: {
            ...layer.paint,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 2, 20, 4.5],
            'circle-opacity': VERTEX_OPACITY,
          },
        }
      case VIEWER_UNTAGGED_LAYER_ID:
        return {
          ...layer,
          id: CHANGESET_NODE_VERTEX_LAYER_ID,
          filter: nodeFilter(layer, false),
          paint: {
            ...layer.paint,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 1.25, 20, 3],
            'circle-opacity': VERTEX_OPACITY,
          },
        }
      case CHANGESET_NODE_POINT_BG_LAYER_ID:
        return {
          ...layer,
          filter: nodeFilter(layer, true),
          paint: { ...layer.paint, 'circle-radius': 9 },
        }
      case CHANGESET_NODE_POINT_LAYER_ID:
        return {
          ...layer,
          filter: nodeFilter(layer, true),
          paint: {
            ...layer.paint,
            'circle-radius': 5,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': POINT_RING_COLOR,
          },
        }
      default:
        return layer
    }
  })
}
