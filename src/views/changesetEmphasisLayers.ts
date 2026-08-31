import { CHANGESET_SOURCE_ID } from './changesetAdiffViewer.ts'

export const CHANGESET_EMPHASIS_WAY_LAYER_ID = 'changeset-emphasis-way'
const CHANGESET_EMPHASIS_RELATION_LAYER_ID = 'changeset-emphasis-relation'
export const CHANGESET_EMPHASIS_NODE_LAYER_ID = 'changeset-emphasis-node'

export const CHANGESET_EMPHASIS_LAYER_IDS = [
  CHANGESET_EMPHASIS_WAY_LAYER_ID,
  CHANGESET_EMPHASIS_RELATION_LAYER_ID,
  CHANGESET_EMPHASIS_NODE_LAYER_ID,
] as const

const SELECTED: unknown[] = ['boolean', ['feature-state', 'selected'], false]
const HIGHLIGHTED: unknown[] = ['boolean', ['feature-state', 'highlighted'], false]

/** Yellow halo for selection; white for hover. Stronger than the adiff viewer case. */
const HALO_COLOR: unknown[] = [
  'case',
  SELECTED,
  'hsl(45 93% 47%)',
  HIGHLIGHTED,
  'hsl(0 0% 100%)',
  'hsla(0 0% 0% / 0)',
]

const HALO_OPACITY: unknown[] = ['case', SELECTED, 0.92, HIGHLIGHTED, 0.55, 0]

const WAY_HALO_WIDTH: unknown[] = ['case', SELECTED, 18, HIGHLIGHTED, 11, 0]

const NODE_HALO_RADIUS: unknown[] = ['case', SELECTED, 14, HIGHLIGHTED, 10, 0]

type EmphasisLayer = {
  id: string
  type: 'line' | 'circle'
  source: string
  filter: unknown[]
  layout?: Record<string, string>
  paint: Record<string, unknown>
}

function changesetEmphasisLayers(): EmphasisLayer[] {
  return [
    {
      id: CHANGESET_EMPHASIS_WAY_LAYER_ID,
      type: 'line',
      source: CHANGESET_SOURCE_ID,
      filter: ['==', 'type', 'way'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': HALO_COLOR,
        'line-width': WAY_HALO_WIDTH,
        'line-opacity': HALO_OPACITY,
        'line-blur': 0.6,
      },
    },
    {
      id: CHANGESET_EMPHASIS_RELATION_LAYER_ID,
      type: 'line',
      source: CHANGESET_SOURCE_ID,
      filter: ['==', 'type', 'relation'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': HALO_COLOR,
        'line-width': WAY_HALO_WIDTH,
        'line-opacity': HALO_OPACITY,
        'line-blur': 0.6,
        'line-offset': -5,
      },
    },
    {
      id: CHANGESET_EMPHASIS_NODE_LAYER_ID,
      type: 'circle',
      source: CHANGESET_SOURCE_ID,
      filter: ['==', 'type', 'node'],
      paint: {
        'circle-color': HALO_COLOR,
        'circle-radius': NODE_HALO_RADIUS,
        'circle-opacity': HALO_OPACITY,
        'circle-blur': 0.2,
      },
    },
  ]
}

export const CHANGESET_EMPHASIS_LAYERS = changesetEmphasisLayers()

export function emphasisPaintCaseValues(
  paintValue: unknown,
  selectedIndex = 2,
  highlightedIndex = 4,
) {
  if (!Array.isArray(paintValue) || paintValue[0] !== 'case') {
    return { selected: undefined, highlighted: undefined }
  }
  return {
    selected: paintValue[selectedIndex],
    highlighted: paintValue[highlightedIndex],
  }
}
