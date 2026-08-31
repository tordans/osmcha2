import { z } from 'zod'

/** Visible map layers. Omit `layers` when every changeset layer is on and spyglass is on. */

const MAP_LAYER_TOKENS = [
  'create',
  'modify',
  'delete',
  'noop',
  'node',
  'way',
  'relation',
  'spyglass',
] as const

const REVIEW_TOKENS = ['seen', 'unseen'] as const

/** Opt-out tokens for the exclusive Seen/Unseen radio. `no-unseen` → Seen only;
 * bare / `no-seen` → Unseen only (default). */
const HIDE_SEEN_TOKEN = 'no-seen'
const HIDE_UNSEEN_TOKEN = 'no-unseen'

const styleLayerTokenSchema = z.enum(MAP_LAYER_TOKENS)
const hideReviewTokenSchema = z.enum([HIDE_SEEN_TOKEN, HIDE_UNSEEN_TOKEN])

export type MapLayerToken = (typeof MAP_LAYER_TOKENS)[number] | (typeof REVIEW_TOKENS)[number]

export type MapLayers = {
  showElements: string[]
  showActions: string[]
  spyglass: boolean
  showSeen: boolean
  showUnseen: boolean
}

const ELEMENT_TOKENS = ['node', 'way', 'relation'] as const
const ACTION_TOKENS = ['create', 'modify', 'delete', 'noop'] as const

/** Review map filter: exactly one side is visible (radio, not independent checkboxes). */
export type ReviewFilter = 'unseen' | 'seen'

export const DEFAULT_MAP_LAYERS: MapLayers = {
  showElements: [...ELEMENT_TOKENS],
  showActions: [...ACTION_TOKENS],
  spyglass: true,
  showSeen: false,
  showUnseen: true,
}

function isStyleLayerToken(value: string): value is (typeof MAP_LAYER_TOKENS)[number] {
  return styleLayerTokenSchema.safeParse(value).success
}

function sameMembers(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((token) => b.includes(token))
}

function isDefaultStyleLayers(layers: MapLayers) {
  return (
    layers.spyglass === DEFAULT_MAP_LAYERS.spyglass &&
    sameMembers(layers.showElements, DEFAULT_MAP_LAYERS.showElements) &&
    sameMembers(layers.showActions, DEFAULT_MAP_LAYERS.showActions)
  )
}

export function isDefaultMapLayers(layers: MapLayers) {
  return (
    isDefaultStyleLayers(layers) &&
    layers.showSeen === DEFAULT_MAP_LAYERS.showSeen &&
    layers.showUnseen === DEFAULT_MAP_LAYERS.showUnseen
  )
}

export function parseLayersParam(value: unknown) {
  const asString = z.string().safeParse(value)
  if (!asString.success) return DEFAULT_MAP_LAYERS
  const raw = asString.data
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
  const hideTokens = raw.flatMap((token) => {
    const parsed = hideReviewTokenSchema.safeParse(token)
    return parsed.success ? [parsed.data] : []
  })
  const hasNoSeen = hideTokens.includes(HIDE_SEEN_TOKEN)
  const hasNoUnseen = hideTokens.includes(HIDE_UNSEEN_TOKEN)
  // Exclusive radio. Seen-only when `no-unseen` alone; everything else → Unseen
  // (including legacy “both on” URLs with neither token).
  const showSeen = hasNoUnseen && !hasNoSeen
  const showUnseen = !showSeen
  const tokens = new Set(raw.filter(isStyleLayerToken))
  if (raw.length === 0) {
    return {
      showElements: [],
      showActions: [],
      spyglass: false,
      showSeen: false,
      showUnseen: true,
    }
  }
  if (tokens.size === 0) {
    return { ...DEFAULT_MAP_LAYERS, showSeen, showUnseen }
  }
  return {
    showElements: ELEMENT_TOKENS.filter((token) => tokens.has(token)),
    showActions: ACTION_TOKENS.filter((token) => tokens.has(token)),
    spyglass: tokens.has('spyglass'),
    showSeen,
    showUnseen,
  }
}

export function serializeLayersParam(layers: MapLayers) {
  if (isDefaultMapLayers(layers)) return undefined
  const hideTokens: string[] = []
  // Unseen is the default review side — only Seen-only needs a URL token.
  if (layers.showSeen && !layers.showUnseen) hideTokens.push(HIDE_UNSEEN_TOKEN)
  if (isDefaultStyleLayers(layers)) {
    return hideTokens.length > 0 ? hideTokens.join(',') : undefined
  }
  const tokens = MAP_LAYER_TOKENS.filter((token: MapLayerToken) => {
    switch (token) {
      case 'seen':
      case 'unseen':
        return false
      case 'spyglass':
        return layers.spyglass
      case 'node':
      case 'way':
      case 'relation':
        return layers.showElements.includes(token)
      case 'create':
      case 'modify':
      case 'delete':
      case 'noop':
        return layers.showActions.includes(token)
    }
  })
  return [...tokens, ...hideTokens].join(',')
}

export function searchWithLayers<T extends object>(search: T, layers: MapLayers): T {
  const serialized = serializeLayersParam(layers)
  if (serialized === undefined) {
    const { layers: _layers, ...rest } = search as T & { layers?: unknown }
    return rest as T
  }
  return { ...search, layers: serialized }
}

export function reviewFilterOf(layers: MapLayers) {
  if (layers.showSeen && !layers.showUnseen) return 'seen'
  return 'unseen'
}

export function setReviewFilter(layers: MapLayers, filter: ReviewFilter) {
  if (filter === 'seen') return { ...layers, showSeen: true, showUnseen: false }
  return { ...layers, showSeen: false, showUnseen: true }
}

export function toggleMapLayer(layers: MapLayers, token: MapLayerToken) {
  switch (token) {
    case 'seen':
      return setReviewFilter(layers, 'seen')
    case 'unseen':
      return setReviewFilter(layers, 'unseen')
    case 'spyglass':
      return { ...layers, spyglass: !layers.spyglass }
    case 'node':
    case 'way':
    case 'relation': {
      const has = layers.showElements.includes(token)
      return {
        ...layers,
        showElements: has
          ? layers.showElements.filter((item) => item !== token)
          : [...layers.showElements, token],
      }
    }
    case 'create':
    case 'modify':
    case 'delete':
    case 'noop': {
      const has = layers.showActions.includes(token)
      return {
        ...layers,
        showActions: has
          ? layers.showActions.filter((item) => item !== token)
          : [...layers.showActions, token],
      }
    }
  }
}

export function mapLayerIsOn(layers: MapLayers, token: MapLayerToken) {
  switch (token) {
    case 'seen':
      return layers.showSeen
    case 'unseen':
      return layers.showUnseen
    case 'spyglass':
      return layers.spyglass
    case 'node':
    case 'way':
    case 'relation':
      return layers.showElements.includes(token)
    case 'create':
    case 'modify':
    case 'delete':
    case 'noop':
      return layers.showActions.includes(token)
  }
}
