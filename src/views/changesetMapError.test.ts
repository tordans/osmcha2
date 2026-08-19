import { describe, expect, test } from 'vitest'
import { splitChangesetLayers } from './changesetAdiffViewer.ts'
import { changesetMapErrorCopy } from './changesetMapError.ts'

describe('changesetMapErrorCopy', () => {
  test('treats adiff 404s as a lag, not a generic crash', () => {
    expect(changesetMapErrorCopy(new Error('GET /changesets/1.adiff returned 404'))).toEqual({
      title: 'Map data is not ready yet',
      description:
        'OSMCha’s changeset visualization can lag a few minutes behind OpenStreetMap. Retry in a moment, or open an older changeset.',
    })
  })

  test('keeps a generic map-load message for other failures', () => {
    expect(changesetMapErrorCopy(new Error('network down'))).toEqual({
      title: 'Could not load the changeset map',
      description: 'network down',
    })
  })
})

describe('splitChangesetLayers', () => {
  test('keeps the dim overlay out of the GeoJSON source group', () => {
    const layers = [
      { id: 'changeset-overlay-bg' },
      { id: 'changeset-way-new' },
      { id: 'changeset-node-tagged' },
    ]
    expect(splitChangesetLayers(layers)).toEqual({
      overlayBg: { id: 'changeset-overlay-bg' },
      featureLayers: [{ id: 'changeset-way-new' }, { id: 'changeset-node-tagged' }],
    })
  })
})
