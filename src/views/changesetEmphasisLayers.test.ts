import { describe, expect, test } from 'vitest'
import {
  CHANGESET_EMPHASIS_LAYER_IDS,
  CHANGESET_EMPHASIS_LAYERS,
  CHANGESET_EMPHASIS_NODE_LAYER_ID,
  CHANGESET_EMPHASIS_WAY_LAYER_ID,
  emphasisPaintCaseValues,
} from './changesetEmphasisLayers.ts'

describe('changesetEmphasisLayers', () => {
  test('sits between case and core with way, relation, and node halos', () => {
    expect(CHANGESET_EMPHASIS_LAYERS.map((layer) => layer.id)).toEqual([
      ...CHANGESET_EMPHASIS_LAYER_IDS,
    ])
  })

  test('selected halo is stronger than hover', () => {
    const way = CHANGESET_EMPHASIS_LAYERS.find(
      (layer) => layer.id === CHANGESET_EMPHASIS_WAY_LAYER_ID,
    )
    const node = CHANGESET_EMPHASIS_LAYERS.find(
      (layer) => layer.id === CHANGESET_EMPHASIS_NODE_LAYER_ID,
    )
    const wayWidth = emphasisPaintCaseValues(way?.paint['line-width'])
    const wayOpacity = emphasisPaintCaseValues(way?.paint['line-opacity'])
    const nodeRadius = emphasisPaintCaseValues(node?.paint['circle-radius'])

    expect(wayWidth.selected).toBeGreaterThan(wayWidth.highlighted as number)
    expect(wayOpacity.selected).toBeGreaterThan(wayOpacity.highlighted as number)
    expect(nodeRadius.selected).toBeGreaterThan(nodeRadius.highlighted as number)
  })
})
