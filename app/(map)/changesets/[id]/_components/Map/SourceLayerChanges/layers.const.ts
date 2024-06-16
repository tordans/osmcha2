import { THighlightedFeatures } from '@app/(map)/_data/highlightedFeatures.zustand'
import { TSelectedFeatures } from '@app/(map)/_data/selectedFeatures.zustand'

export const layers = (
  selectedFeatures: TSelectedFeatures['selectedFeatures'],
  highlightFeatures: THighlightedFeatures['highlightedFeatures'],
) => {
  const idFilter = (ids: string[] | null) => {
    if (!ids?.length) return ['==', 'id', ''] as const
    // return ['in', 'id', ['literal', ids]] as const
    return ['all', ...ids.map((id) => ['==', 'id', id] as const)]
  }
  const highlightFilters = idFilter(highlightFeatures)
  const selectedFilters = idFilter(selectedFeatures)

  return {
    'bg-line': {
      type: 'line',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': 'hsl(0, 0%, 15%)',
        'line-width': 12,
        'line-blur': 0.2,
        'line-opacity': {
          base: 1.5,
          stops: [
            [12, 0.5],
            [18, 0.2],
          ],
        },
      },
      filter: ['all', ['==', 'type', 'way']],
    },
    'bg-point': {
      type: 'circle',
      paint: {
        'circle-color': 'hsl(0, 0%, 15%)',
        'circle-blur': 0.2,
        'circle-opacity': {
          base: 1.5,
          stops: [
            [12, 0.5],
            [18, 0.2],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 12],
            [16, 10],
          ],
        },
      },
      filter: ['all', ['==', '$type', 'Point']],
    },
    'highlight-line': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': 'hsl(0, 0%, 75%)',
        'line-width': {
          base: 1,
          stops: [
            [10, 15],
            [16, 10],
          ],
        },
        'line-opacity': {
          base: 1.5,
          stops: [
            [12, 0.75],
            [18, 0.75],
          ],
        },
      },
      filter: ['all', highlightFilters, ['==', '$type', 'LineString']],
    },
    'highlight-point': {
      type: 'circle',
      paint: {
        'circle-color': 'hsl(0, 0%, 75%)',
        'circle-radius': {
          base: 1,
          stops: [
            [10, 10],
            [16, 11],
          ],
        },
        'circle-opacity': 0.8,
      },
      filter: ['all', highlightFilters, ['==', '$type', 'Point']],
    },
    'highlight-relation-member-line': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': 'hsl(267, 81%, 82%)',
        'line-width': {
          base: 1,
          stops: [
            [10, 15],
            [16, 10],
          ],
        },
        'line-opacity': {
          base: 1,
          stops: [
            [12, 0.5],
            [18, 0.5],
          ],
        },
      },
      filter: ['all', ['==', 'ref', ''], ['==', '$type', 'LineString']],
    },
    'highlight-relation-member-point': {
      type: 'circle',
      paint: {
        'circle-color': 'hsl(267, 81%, 82%)',
        'circle-radius': {
          base: 1,
          stops: [
            [10, 10],
            [16, 11],
          ],
        },
        'circle-opacity': 0.8,
      },
      filter: ['all', ['==', 'ref', ''], ['==', '$type', 'Point']],
    },

    // RELATION MEMBERS

    'deleted-relation-member-line': {
      type: 'line',
      paint: {
        'line-color': '#CC2C47',
        'line-width': {
          base: 1,
          stops: [
            [8, 3],
            [12, 5],
          ],
        },
        'line-dasharray': [0.1, 0.25],
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'modified-relation-member-old-line': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#DB950A',
        'line-width': {
          base: 1,
          stops: [
            [8, 3],
            [12, 6],
          ],
        },
        'line-blur': {
          base: 1,
          stops: [
            [8, 0.25],
            [12, 0.5],
          ],
        },
        'line-opacity': 0.6,
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'modified-relation-member-new-line': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#E8E845',
        'line-width': {
          base: 1,
          stops: [
            [8, 1],
            [12, 2],
          ],
        },
        'line-opacity': 0.6,
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'added-relation-member-line': {
      type: 'line',
      interactive: true,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#39DBC0',
        'line-width': {
          base: 1,
          stops: [
            [8, 1.5],
            [12, 2],
          ],
        },
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'modified-relation-member-old-point-on-way': {
      type: 'circle',
      paint: {
        'circle-color': '#DB950A',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
        'circle-blur': 0.25,
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 2.5],
            [16, 3.5],
          ],
        },
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'modified-relation-member-new-point-on-way': {
      type: 'circle',
      paint: {
        'circle-color': '#E8E845',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.25],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1.25],
            [16, 2.25],
          ],
        },
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'deleted-relation-member-point': {
      type: 'circle',
      paint: {
        'circle-color': '#CC2C47',
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 2],
            [16, 3],
          ],
        },
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'added-relation-member-point': {
      type: 'circle',
      paint: {
        'circle-color': '#39DBC0',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.3],
            [14, 0.75],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1.25],
            [16, 1.9],
          ],
        },
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'added-relation-member-point-with-role': {
      type: 'circle',
      paint: {
        'circle-color': '#39DBC0',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.3],
            [14, 0.75],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1],
            [16, 5],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#39DBC0',
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'modified-relation-member-new-point': {
      type: 'circle',
      paint: {
        'circle-color': '#E8E845',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.75],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 2],
            [16, 7],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#E8E845',
      },
      filter: ['all', ['==', 'relation', '']],
    },
    'modified-relation-member-old-point': {
      type: 'circle',
      paint: {
        'circle-color': '#DB950A',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1.75],
            [16, 3],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#DB950A',
      },
      filter: ['all', ['==', 'relation', '']],
    },

    // RELATIONS
    'deleted-relation': {
      type: 'line',
      paint: {
        'line-color': '#CC2C47',
        'line-width': {
          base: 1,
          stops: [
            [8, 1.5],
            [12, 1.5],
          ],
        },
        'line-dasharray': [0.1, 0.1],
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'type', 'relation'], ['==', 'changeType', 'deletedNew']],
    },
    'modified-old-relation': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#DB950A',
        'line-width': {
          base: 1,
          stops: [
            [8, 1.75],
            [12, 1.75],
          ],
        },
        'line-blur': 0.25,
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'type', 'relation'], ['==', 'changeType', 'modifiedOld']],
    },
    'modified-new-relation': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#E8E845',
        'line-width': {
          base: 1,
          stops: [
            [8, 1.25],
            [12, 1.25],
          ],
        },
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'type', 'relation'], ['==', 'changeType', 'modifiedNew']],
    },
    'added-relation': {
      type: 'line',
      interactive: true,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#39DBC0',
        'line-width': {
          base: 1,
          stops: [
            [8, 1],
            [12, 1],
          ],
        },
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'type', 'relation'], ['==', 'changeType', 'added']],
    },
    'deleted-line': {
      type: 'line',
      paint: {
        'line-color': '#CC2C47',
        'line-width': {
          base: 1,
          stops: [
            [8, 3],
            [12, 5],
          ],
        },
        'line-dasharray': [0.1, 0.25],
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'type', 'way'], ['==', 'changeType', 'deletedNew']],
    },
    'modified-old-point-on-way': {
      type: 'circle',
      paint: {
        'circle-color': '#DB950A',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
        'circle-blur': 0.25,
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 2.5],
            [16, 3.5],
          ],
        },
      },
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'changeType', 'modifiedOld']],
    },
    'modified-old-line': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#DB950A',
        'line-width': {
          base: 1,
          stops: [
            [8, 3],
            [12, 6],
          ],
        },
        'line-blur': {
          base: 1,
          stops: [
            [8, 0.25],
            [12, 0.5],
          ],
        },
        'line-opacity': 0.6,
      },
      filter: ['all', ['==', 'type', 'way'], ['==', 'changeType', 'modifiedOld']],
    },
    'modified-new-point-on-way': {
      type: 'circle',
      paint: {
        'circle-color': '#E8E845',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.25],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1.25],
            [16, 2.25],
          ],
        },
      },
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'changeType', 'modifiedNew']],
    },
    'modified-new-line': {
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#E8E845',
        'line-width': {
          base: 1,
          stops: [
            [8, 1],
            [12, 2],
          ],
        },
        'line-opacity': 0.6,
      },
      filter: ['all', ['==', 'type', 'way'], ['==', 'changeType', 'modifiedNew']],
    },
    'added-line': {
      type: 'line',
      interactive: true,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#39DBC0',
        'line-width': {
          base: 1,
          stops: [
            [8, 1],
            [12, 1.5],
          ],
        },
        'line-opacity': 0.8,
      },
      filter: ['all', ['==', 'type', 'way'], ['==', 'changeType', 'added']],
    },
    'deleted-point-untagged': {
      type: 'circle',
      paint: {
        'circle-color': '#CC2C47',
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 2],
            [16, 3],
          ],
        },
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
      },
      filter: [
        'all',
        ['==', 'changeType', 'deletedOld'],
        ['any', ['==', 'tagsCount', 0], ['==', '$type', 'LineString']],
      ],
    },
    'modified-old-point-untagged': {
      type: 'circle',
      paint: {
        'circle-color': '#DB950A',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1.75],
            [16, 3],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#DB950A',
      },
      filter: [
        'all',
        ['==', 'type', 'node'],
        ['==', 'changeType', 'modifiedOld'],
        ['==', 'tagsCount', 0],
      ],
    },
    'modified-new-point-untagged': {
      type: 'circle',
      paint: {
        'circle-color': '#E8E845',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 0.75],
            [16, 2],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#E8E845',
      },
      filter: [
        'all',
        ['==', 'type', 'node'],
        ['==', 'changeType', 'modifiedNew'],
        ['==', 'tagsCount', 0],
      ],
    },
    'added-point-untagged': {
      type: 'circle',
      paint: {
        'circle-color': '#39DBC0',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.3],
            [14, 0.75],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1.25],
            [16, 1.9],
          ],
        },
      },
      filter: [
        'all',
        ['==', 'type', 'node'],
        ['==', 'changeType', 'added'],
        ['==', 'tagsCount', 0],
      ],
    },
    'deleted-point-tagged': {
      type: 'circle',
      paint: {
        'circle-color': '#CC2C47',
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 4],
            [16, 7],
          ],
        },
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.5],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.75,
        'circle-stroke-color': '#CC2C47',
      },
      filter: [
        'all',
        ['==', 'type', 'node'],
        ['==', 'changeType', 'deletedOld'],
        ['!=', 'tagsCount', 0],
      ],
    },
    'modified-old-point-tagged': {
      type: 'circle',
      paint: {
        'circle-color': '#DB950A',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.75],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 2.5],
            [16, 9],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#DB950A',
      },
      filter: [
        'all',
        ['==', 'type', 'node'],
        ['==', 'changeType', 'modifiedOld'],
        ['!=', 'tagsCount', 0],
      ],
    },
    'modified-new-point-tagged': {
      type: 'circle',
      paint: {
        'circle-color': '#E8E845',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.25],
            [14, 0.75],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 2],
            [16, 7],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#E8E845',
      },
      filter: [
        'all',
        ['==', 'type', 'node'],
        ['==', 'changeType', 'modifiedNew'],
        ['!=', 'tagsCount', 0],
      ],
    },
    'added-point-tagged': {
      type: 'circle',
      paint: {
        'circle-color': '#39DBC0',
        'circle-opacity': {
          base: 1.5,
          stops: [
            [10, 0.3],
            [14, 0.75],
          ],
        },
        'circle-radius': {
          base: 1.5,
          stops: [
            [10, 1],
            [16, 5],
          ],
        },
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-stroke-color': '#39DBC0',
      },
      filter: [
        'all',
        ['==', 'type', 'node'],
        ['==', 'changeType', 'added'],
        ['!=', 'tagsCount', 0],
      ],
    },
  }
}
