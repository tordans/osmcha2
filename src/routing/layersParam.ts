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

export type MapLayerToken = (typeof MAP_LAYER_TOKENS)[number]

export type MapLayers = {
  showElements: string[]
  showActions: string[]
  spyglass: boolean
}

const ELEMENT_TOKENS = ['node', 'way', 'relation'] as const
const ACTION_TOKENS = ['create', 'modify', 'delete', 'noop'] as const
const TOKEN_SET = new Set<string>(MAP_LAYER_TOKENS)

export const DEFAULT_MAP_LAYERS: MapLayers = {
  showElements: [...ELEMENT_TOKENS],
  showActions: [...ACTION_TOKENS],
  spyglass: true,
}

function isMapLayerToken(value: string): value is MapLayerToken {
  return TOKEN_SET.has(value)
}

function sameMembers(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((token) => b.includes(token))
}

export function isDefaultMapLayers(layers: MapLayers): boolean {
  return (
    layers.spyglass === DEFAULT_MAP_LAYERS.spyglass &&
    sameMembers(layers.showElements, DEFAULT_MAP_LAYERS.showElements) &&
    sameMembers(layers.showActions, DEFAULT_MAP_LAYERS.showActions)
  )
}

export function parseLayersParam(value: unknown): MapLayers {
  if (typeof value !== 'string') return DEFAULT_MAP_LAYERS
  const tokens = new Set(
    value
      .split(',')
      .map((token) => token.trim())
      .filter(isMapLayerToken),
  )
  return {
    showElements: ELEMENT_TOKENS.filter((token) => tokens.has(token)),
    showActions: ACTION_TOKENS.filter((token) => tokens.has(token)),
    spyglass: tokens.has('spyglass'),
  }
}

export function serializeLayersParam(layers: MapLayers): string | undefined {
  if (isDefaultMapLayers(layers)) return undefined
  return MAP_LAYER_TOKENS.filter((token) => {
    if (token === 'spyglass') return layers.spyglass
    if (token === 'node' || token === 'way' || token === 'relation') {
      return layers.showElements.includes(token)
    }
    return layers.showActions.includes(token)
  }).join(',')
}

export function searchWithLayers<T extends object>(search: T, layers: MapLayers): T {
  const serialized = serializeLayersParam(layers)
  if (serialized === undefined) {
    const { layers: _layers, ...rest } = search as T & { layers?: unknown }
    return rest as T
  }
  return { ...search, layers: serialized }
}

export function toggleMapLayer(layers: MapLayers, token: MapLayerToken): MapLayers {
  if (token === 'spyglass') return { ...layers, spyglass: !layers.spyglass }
  if (token === 'node' || token === 'way' || token === 'relation') {
    const has = layers.showElements.includes(token)
    return {
      ...layers,
      showElements: has
        ? layers.showElements.filter((item) => item !== token)
        : [...layers.showElements, token],
    }
  }
  const has = layers.showActions.includes(token)
  return {
    ...layers,
    showActions: has
      ? layers.showActions.filter((item) => item !== token)
      : [...layers.showActions, token],
  }
}

export function mapLayerIsOn(layers: MapLayers, token: MapLayerToken): boolean {
  if (token === 'spyglass') return layers.spyglass
  if (token === 'node' || token === 'way' || token === 'relation') {
    return layers.showElements.includes(token)
  }
  return layers.showActions.includes(token)
}
