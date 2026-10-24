import { describe, expect, test } from 'vitest'
import type { AdiffAction } from '../components/changeset/changesetElements.ts'
import { changesetInteractiveLayerIds } from './changesetAdiffViewer.ts'
import {
  annotateNodeClickability,
  applyNodeClickabilityStyle,
  isClickableNode,
  wayMemberNodeIds,
} from './changesetNodeLayers.ts'

const actions: AdiffAction[] = [
  {
    type: 'modify',
    old: { type: 'way', id: 1, nodes: [{ ref: 10 }, { ref: 11 }] },
    new: { type: 'way', id: 1, nodes: [{ ref: 10 }, { ref: 12 }] },
  },
  { type: 'create', new: { type: 'node', id: 10 } },
  { type: 'create', new: { type: 'node', id: 11 } },
  { type: 'create', new: { type: 'node', id: 12, tags: { man_made: 'street_cabinet' } } },
  {
    type: 'modify',
    old: { type: 'node', id: 13, tags: { a: 'b' } },
    new: { type: 'node', id: 13 },
  },
  { type: 'create', new: { type: 'node', id: 14 } },
]

function nodeFeature(id: number, side: 'old' | 'new' = 'new') {
  return {
    type: 'Feature' as const,
    id,
    geometry: { type: 'Point' as const, coordinates: [0, 0] },
    properties: { type: 'node', id, side, num_tags: 0 },
  }
}

describe('isClickableNode', () => {
  test('tags or no way membership make a node clickable', () => {
    expect(isClickableNode({ hasTags: true, isWayMember: true })).toBe(true)
    expect(isClickableNode({ hasTags: false, isWayMember: false })).toBe(true)
    expect(isClickableNode({ hasTags: false, isWayMember: true })).toBe(false)
  })
})

describe('wayMemberNodeIds', () => {
  test('collects refs from old and new ways', () => {
    expect([...wayMemberNodeIds(actions)].sort((a, b) => a - b)).toEqual([10, 11, 12])
  })
})

describe('annotateNodeClickability', () => {
  test('marks way corners false, tagged and standalone nodes true', () => {
    const geojson = {
      type: 'FeatureCollection' as const,
      features: [
        nodeFeature(10),
        nodeFeature(11),
        nodeFeature(12),
        nodeFeature(13, 'new'),
        nodeFeature(14),
        { ...nodeFeature(1), properties: { type: 'way', id: 1 } },
      ],
    }
    const annotated = annotateNodeClickability(geojson, actions)
    const flags = annotated.features.map((feature) => feature.properties?.clickable)
    // 10, 11 untagged way corners; 12 tagged; 13 had tags in the old version; 14 orphan; way untouched
    expect(flags).toEqual([false, false, true, true, true, undefined])
    expect(geojson.features[0]?.properties).not.toHaveProperty('clickable')
  })
})

describe('applyNodeClickabilityStyle', () => {
  const actionFilter = ['in', 'action', 'create']
  const nodeLayerFilter = ['all', ['==', 'type', 'node'], actionFilter]
  const viewerLayers: Array<{ id: string; filter?: unknown; paint: Record<string, unknown> }> = [
    { id: 'changeset-node-untagged-bg', filter: nodeLayerFilter, paint: {} },
    { id: 'changeset-node-tagged-bg', filter: nodeLayerFilter, paint: {} },
    { id: 'changeset-node-untagged', filter: nodeLayerFilter, paint: {} },
    { id: 'changeset-node-tagged', filter: nodeLayerFilter, paint: {} },
    { id: 'changeset-way-new', paint: {} },
  ]

  test('splits node layers by the clickable property and keeps the action filter', () => {
    const styled = applyNodeClickabilityStyle(viewerLayers)
    const byId = Object.fromEntries(styled.map((layer) => [layer.id, layer]))
    expect(byId['changeset-node-vertex']?.filter).toEqual([
      'all',
      ['==', 'type', 'node'],
      ['==', 'clickable', false],
      actionFilter,
    ])
    expect(byId['changeset-node-tagged']?.filter).toEqual([
      'all',
      ['==', 'type', 'node'],
      ['==', 'clickable', true],
      actionFilter,
    ])
    expect(byId['changeset-way-new']).toBe(viewerLayers[4])
  })

  test('clickable points get a white ring and are larger than vertices', () => {
    const styled = applyNodeClickabilityStyle(viewerLayers)
    const point = styled.find((layer) => layer.id === 'changeset-node-tagged')
    const vertex = styled.find((layer) => layer.id === 'changeset-node-vertex')
    expect(point?.paint['circle-stroke-color']).toBe('#ffffff')
    expect(Number(point?.paint['circle-stroke-width'])).toBeGreaterThan(0)
    expect(vertex?.paint).not.toHaveProperty('circle-stroke-width')
    expect(Number(point?.paint['circle-radius'])).toBeGreaterThan(4)
  })

  test('vertex layers are drawn but not interactive', () => {
    const styled = applyNodeClickabilityStyle(viewerLayers)
    const ids = changesetInteractiveLayerIds(styled)
    expect(styled.map((layer) => layer.id)).toContain('changeset-node-vertex')
    expect(ids).not.toContain('changeset-node-vertex')
    expect(ids).not.toContain('changeset-node-vertex-bg')
    expect(ids).toContain('changeset-node-tagged-bg')
  })
})
