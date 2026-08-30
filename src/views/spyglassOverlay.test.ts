import { describe, expect, test } from 'vitest'
import {
  CHANGESET_NOOP_LAYER_IDS,
  SPYGLASS_LAYER_IDS,
  SPYGLASS_NODE_HIT_LAYER_ID,
  SPYGLASS_NODE_LAYER_ID,
  SPYGLASS_WAY_HIT_LAYER_ID,
  SPYGLASS_WAY_LAYER_ID,
  changesetClickableLayerIds,
  changesetHoverFromFeatures,
  changesetInspectLayerIds,
  cursorForMapHover,
  inspectHoverFromFeatures,
  inspectTagsFromProperties,
  inspectFlyoutTags,
  isClickableMapFeature,
  spyglassEnabledAtZoom,
  spyglassTileUrls,
} from './spyglassOverlay.ts'

const viewerLayers = [
  { id: 'changeset-overlay-bg' },
  { id: 'changeset-way-new' },
  { id: 'changeset-node-tagged' },
  { id: 'changeset-way-unchanged' },
  { id: 'changeset-node-unchanged' },
]

describe('spyglassTileUrls', () => {
  test('uses an absolute same-origin Vite proxy in dev and the Spyglass host in production', () => {
    expect(spyglassTileUrls(true, 'http://127.0.0.1:3000')).toEqual([
      'http://127.0.0.1:3000/spyglass/vector/osm/{z}/{x}/{y}.mvt',
    ])
    expect(spyglassTileUrls(true, 'http://127.0.0.1:3000/')).toEqual([
      'http://127.0.0.1:3000/spyglass/vector/osm/{z}/{x}/{y}.mvt',
    ])
    expect(spyglassTileUrls(false, 'http://127.0.0.1:3000')).toEqual([
      'https://spyglass.jochentopf.com/vector/osm/{z}/{x}/{y}.mvt',
    ])
  })
})

describe('spyglassEnabledAtZoom', () => {
  test('is off when the toggle is off at any zoom', () => {
    expect(spyglassEnabledAtZoom(false, 0)).toBe('off')
    expect(spyglassEnabledAtZoom(false, 14.99)).toBe('off')
    expect(spyglassEnabledAtZoom(false, 15)).toBe('off')
    expect(spyglassEnabledAtZoom(false, 18)).toBe('off')
  })

  test('is armed below zoom 15 and active at 15', () => {
    expect(spyglassEnabledAtZoom(true, 0)).toBe('armed')
    expect(spyglassEnabledAtZoom(true, 14.99)).toBe('armed')
    expect(spyglassEnabledAtZoom(true, 15)).toBe('active')
    expect(spyglassEnabledAtZoom(true, 18)).toBe('active')
  })
})

describe('changesetClickableLayerIds', () => {
  test('excludes overlay-bg and noop layers', () => {
    expect(changesetClickableLayerIds(viewerLayers)).toEqual([
      'changeset-way-new',
      'changeset-node-tagged',
    ])
  })
})

describe('isClickableMapFeature', () => {
  test('rejects spyglass, dim overlay, and changeset noop', () => {
    expect(isClickableMapFeature({ layer: { id: SPYGLASS_WAY_HIT_LAYER_ID } })).toBe(false)
    expect(isClickableMapFeature({ layer: { id: SPYGLASS_WAY_LAYER_ID } })).toBe(false)
    expect(isClickableMapFeature({ layer: { id: 'changeset-overlay-bg' } })).toBe(false)
    expect(
      isClickableMapFeature({
        layer: { id: 'changeset-way-bg' },
        properties: { action: 'noop' },
      }),
    ).toBe(false)
    expect(isClickableMapFeature({ layer: { id: 'changeset-way-unchanged' } })).toBe(false)
    expect(isClickableMapFeature({ layer: { id: 'changeset-emphasis-way' } })).toBe(false)
  })

  test('accepts create/modify/delete including halo hits', () => {
    expect(
      isClickableMapFeature({
        layer: { id: 'changeset-way-bg' },
        properties: { action: 'create' },
      }),
    ).toBe(true)
    expect(isClickableMapFeature({ layer: { id: 'changeset-way-new' } })).toBe(true)
  })
})

describe('changesetInspectLayerIds', () => {
  test('matches clickable when the overlay is off', () => {
    expect(
      changesetInspectLayerIds(viewerLayers, { overlayActive: false, showNoop: true }),
    ).toEqual(['changeset-way-new', 'changeset-node-tagged'])
  })

  test('adds spyglass hit layers when the overlay is active, not the paint layers', () => {
    const ids = changesetInspectLayerIds(viewerLayers, { overlayActive: true, showNoop: false })
    expect(ids).toEqual(['changeset-way-new', 'changeset-node-tagged', ...SPYGLASS_LAYER_IDS])
    expect(ids).not.toContain(SPYGLASS_WAY_LAYER_ID)
    expect(ids).not.toContain(SPYGLASS_NODE_LAYER_ID)
  })

  test('adds noop and spyglass when overlay is active and noop is shown', () => {
    expect(changesetInspectLayerIds(viewerLayers, { overlayActive: true, showNoop: true })).toEqual(
      [
        'changeset-way-new',
        'changeset-node-tagged',
        ...CHANGESET_NOOP_LAYER_IDS,
        ...SPYGLASS_LAYER_IDS,
      ],
    )
  })
})

describe('cursorForMapHover', () => {
  test('forces crosshair during pin placement', () => {
    expect(
      cursorForMapHover([{ layer: { id: 'changeset-way-new' } }], {
        pinPlacement: true,
        overlayActive: true,
      }),
    ).toBe('crosshair')
  })

  test('prefers pointer over help when a clickable feature is present', () => {
    expect(
      cursorForMapHover(
        [{ layer: { id: SPYGLASS_WAY_HIT_LAYER_ID } }, { layer: { id: 'changeset-way-new' } }],
        { pinPlacement: false, overlayActive: true },
      ),
    ).toBe('pointer')
  })

  test('uses help on spyglass or noop when nothing clickable is hit', () => {
    expect(
      cursorForMapHover([{ layer: { id: SPYGLASS_NODE_HIT_LAYER_ID } }], {
        pinPlacement: false,
        overlayActive: true,
      }),
    ).toBe('help')
    expect(
      cursorForMapHover([{ layer: { id: 'changeset-way-unchanged' } }], {
        pinPlacement: false,
        overlayActive: true,
      }),
    ).toBe('help')
  })

  test('treats halo hits on noop geometry as inspect, not click', () => {
    expect(
      cursorForMapHover(
        [
          {
            layer: { id: 'changeset-way-bg' },
            properties: { action: 'noop', type: 'way', id: 1 },
          },
        ],
        { pinPlacement: false, overlayActive: true },
      ),
    ).toBe('help')
    expect(
      cursorForMapHover(
        [
          {
            layer: { id: 'changeset-way-bg' },
            properties: { action: 'noop', type: 'way', id: 1 },
          },
        ],
        { pinPlacement: false, overlayActive: false },
      ),
    ).toBe('default')
  })

  test('treats halo hits on create/modify/delete as clickable', () => {
    expect(
      cursorForMapHover(
        [
          {
            layer: { id: 'changeset-way-bg' },
            properties: { action: 'create', type: 'way', id: 1 },
          },
        ],
        { pinPlacement: false, overlayActive: true },
      ),
    ).toBe('pointer')
  })

  test('defaults when there are no inspectable hits', () => {
    expect(cursorForMapHover([], { pinPlacement: false, overlayActive: true })).toBe('default')
    expect(cursorForMapHover(undefined, { pinPlacement: false, overlayActive: true })).toBe(
      'default',
    )
    expect(
      cursorForMapHover([{ layer: { id: 'changeset-overlay-bg' } }], {
        pinPlacement: false,
        overlayActive: true,
      }),
    ).toBe('default')
  })
})

describe('inspectTagsFromProperties', () => {
  test('skips metadata, @keys, and nullish values', () => {
    expect(
      inspectTagsFromProperties({
        type: 'way',
        id: 1,
        highway: 'residential',
        name: 'Main',
        '@timestamp': '2026-01-01',
        empty: null,
        missing: undefined,
      }),
    ).toEqual([
      ['highway', 'residential'],
      ['name', 'Main'],
    ])
  })

  test('flattens a nested tags object instead of top-level keys', () => {
    expect(
      inspectTagsFromProperties({
        type: 'node',
        id: 99,
        highway: 'should-not-appear',
        tags: {
          amenity: 'bench',
          '@id': 'skip',
          type: 'multipolygon',
        },
      }),
    ).toEqual([
      ['amenity', 'bench'],
      ['type', 'multipolygon'],
    ])
  })
})

describe('changesetHoverFromFeatures', () => {
  test('returns the first clickable changeset element', () => {
    expect(
      changesetHoverFromFeatures([
        {
          id: 10,
          source: 'spyglass',
          sourceLayer: 'ways',
          layer: { id: SPYGLASS_WAY_HIT_LAYER_ID },
          properties: { highway: 'path' },
        },
        {
          id: 1,
          source: 'changeset',
          layer: { id: 'changeset-way-new' },
          properties: { type: 'way', id: 50 },
        },
      ]),
    ).toEqual({ type: 'way', id: 50 })
  })

  test('ignores spyglass, noop, and emphasis layers', () => {
    expect(
      changesetHoverFromFeatures([
        {
          id: 7,
          source: 'spyglass',
          sourceLayer: 'nodes',
          layer: { id: SPYGLASS_NODE_HIT_LAYER_ID },
          properties: { name: 'Shop' },
        },
        {
          id: 0,
          source: 'changeset',
          layer: { id: 'changeset-way-bg' },
          properties: { action: 'noop', type: 'way', id: 42 },
        },
        {
          id: 2,
          source: 'changeset',
          layer: { id: 'changeset-emphasis-way' },
          properties: { type: 'way', id: 99 },
        },
      ]),
    ).toBeNull()
  })
})

describe('inspectHoverFromFeatures', () => {
  test('ignores the thin spyglass paint layer', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 10,
          source: 'spyglass',
          sourceLayer: 'ways',
          layer: { id: SPYGLASS_WAY_LAYER_ID },
          properties: { highway: 'path' },
        },
      ]),
    ).toBeNull()
  })

  test('returns null when a clickable changeset feature is present', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 10,
          source: 'spyglass',
          sourceLayer: 'ways',
          layer: { id: SPYGLASS_WAY_HIT_LAYER_ID },
          properties: { highway: 'path' },
        },
        {
          id: 1,
          source: 'changeset',
          layer: { id: 'changeset-way-new' },
          properties: { type: 'way', id: 50 },
        },
      ]),
    ).toBeNull()
  })

  test('uses the first spyglass hit and lists remaining unique objects', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 123,
          source: 'spyglass',
          sourceLayer: 'ways',
          layer: { id: SPYGLASS_WAY_HIT_LAYER_ID },
          properties: { highway: 'residential' },
        },
        {
          id: 123,
          source: 'spyglass',
          sourceLayer: 'ways',
          layer: { id: SPYGLASS_WAY_HIT_LAYER_ID },
          properties: { highway: 'residential' },
        },
        {
          id: 456,
          source: 'spyglass',
          sourceLayer: 'nodes',
          layer: { id: SPYGLASS_NODE_HIT_LAYER_ID },
          properties: { amenity: 'bench' },
        },
      ]),
    ).toEqual({
      items: [
        {
          kind: 'spyglass',
          type: 'way',
          id: 123,
          tags: [['highway', 'residential']],
        },
        {
          kind: 'spyglass',
          type: 'node',
          id: 456,
          tags: [['amenity', 'bench']],
        },
      ],
      extraCount: 0,
    })
  })

  test('reads noop type and id from a halo layer with action noop', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 0,
          source: 'changeset',
          layer: { id: 'changeset-way-bg' },
          properties: { action: 'noop', type: 'way', id: 42, tags: { highway: 'path' } },
        },
      ]),
    ).toEqual({
      items: [
        {
          kind: 'noop',
          type: 'way',
          id: 42,
          tags: [['highway', 'path']],
        },
      ],
      extraCount: 0,
    })
  })

  test('keeps OSM tags that collide with changeset metadata on spyglass hits', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 7,
          source: 'spyglass',
          sourceLayer: 'nodes',
          layer: { id: SPYGLASS_NODE_HIT_LAYER_ID },
          properties: { action: 'store', type: 'amenity', name: 'Shop' },
        },
      ]),
    ).toEqual({
      items: [
        {
          kind: 'spyglass',
          type: 'node',
          id: 7,
          tags: [
            ['action', 'store'],
            ['type', 'amenity'],
            ['name', 'Shop'],
          ],
        },
      ],
      extraCount: 0,
    })
  })

  test('reads noop type and id from properties', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 0,
          source: 'changeset',
          layer: { id: 'changeset-node-unchanged' },
          properties: { type: 'node', id: 789, natural: 'tree' },
        },
      ]),
    ).toEqual({
      items: [
        {
          kind: 'noop',
          type: 'node',
          id: 789,
          tags: [['natural', 'tree']],
        },
      ],
      extraCount: 0,
    })
  })

  test('lists each unique noop with its tags instead of +N more', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 0,
          source: 'changeset',
          layer: { id: 'changeset-way-unchanged' },
          properties: { type: 'way', id: 32029130, tags: { highway: 'residential' } },
        },
        {
          id: 0,
          source: 'changeset',
          layer: { id: 'changeset-node-unchanged' },
          properties: { type: 'node', id: 99, natural: 'tree' },
        },
      ]),
    ).toEqual({
      items: [
        {
          kind: 'noop',
          type: 'way',
          id: 32029130,
          tags: [['highway', 'residential']],
        },
        {
          kind: 'noop',
          type: 'node',
          id: 99,
          tags: [['natural', 'tree']],
        },
      ],
      extraCount: 0,
    })
  })

  test('keeps the richer tags when the same object is hit twice', () => {
    expect(
      inspectHoverFromFeatures([
        {
          id: 0,
          source: 'changeset',
          layer: { id: 'changeset-way-unchanged' },
          properties: { type: 'way', id: 1 },
        },
        {
          id: 1,
          source: 'spyglass',
          sourceLayer: 'ways',
          layer: { id: SPYGLASS_WAY_HIT_LAYER_ID },
          properties: { highway: 'path', name: 'Lane' },
        },
      ]),
    ).toEqual({
      items: [
        {
          kind: 'noop',
          type: 'way',
          id: 1,
          tags: [
            ['highway', 'path'],
            ['name', 'Lane'],
          ],
        },
      ],
      extraCount: 0,
    })
  })
})

describe('inspectFlyoutTags', () => {
  test('keeps up to 20 tag rows and folds the rest into +N more', () => {
    const tags = Array.from({ length: 21 }, (_, index) => [`k${index}`, 'v'] as [string, string])
    expect(inspectFlyoutTags(tags)).toEqual({
      tags: tags.slice(0, 20),
      moreCount: 1,
    })
  })
})
