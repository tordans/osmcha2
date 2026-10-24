import { getLayers } from '@osm-editor-kit/maplibre-editor-layer-index'
import { describe, expect, it } from 'vitest'
import {
  imageryNameSeriesKey,
  isDuplicateOfBuiltinLayer,
  matchBuiltinStyleId,
  matchImageryUsedSelection,
  matchImageryUsedStyleId,
  normalizeImageryName,
  parseImageryUsed,
  resolveImageryUsed,
  type ImageryLayerRef,
} from './matchImageryUsed.ts'

const layers: ImageryLayerRef[] = [
  { id: 'Berlin-2022', name: 'Berlin/Geoportal DOP20RGB (2022)', overlay: false },
  { id: 'Berlin-2025', name: 'Berlin/Geoportal DOP20RGB (2025)', overlay: false },
  { id: 'Berlin-2025-Summer', name: 'Berlin/Geoportal DOP20RGB (2025) Sommer', overlay: false },
  {
    id: 'Berlin-Baumbestand_Alkis',
    name: 'Berlin/Geoportal Baumbestand, Alkis s/w',
    overlay: false,
  },
  { id: 'EsriWorldImagery', name: 'Esri World Imagery', overlay: false },
  { id: 'MAPNIK', name: 'OpenStreetMap (Standard)', overlay: false },
  { id: 'Mapillary', name: 'Mapillary Images', overlay: true },
  { id: 'Mapbox', name: 'Mapbox Satellite', overlay: false, requiresKeys: ['apikey'] },
  { id: 'PNOA-a', name: 'PNOA Spain', overlay: false },
  { id: 'PNOA-b', name: 'PNOA Spain', overlay: false },
  { id: 'osm-gps', name: 'OpenStreetMap GPS traces', overlay: true },
]

function styleIds(value: string) {
  return resolveImageryUsed(value, layers).matches.map((match) => match.styleId)
}

describe('parseImageryUsed', () => {
  it('splits iD lists at semicolons and drops street-level photos', () => {
    expect(parseImageryUsed('Bing aerial imagery;Mapillary Images;Esri World Imagery')).toEqual([
      'Bing aerial imagery',
      'Esri World Imagery',
    ])
  })

  it('keeps commas inside a name', () => {
    expect(parseImageryUsed('Berlin/Geoportal Baumbestand, Alkis s/w;Bing aerial imagery')).toEqual(
      ['Berlin/Geoportal Baumbestand, Alkis s/w', 'Bing aerial imagery'],
    )
  })

  it('ignores empty, Not reported and custom entries', () => {
    expect(parseImageryUsed(null)).toEqual([])
    expect(parseImageryUsed('')).toEqual([])
    expect(parseImageryUsed('Not reported')).toEqual([])
    expect(parseImageryUsed(' ; ;')).toEqual([])
    expect(parseImageryUsed('Custom (https://tiles.example/{z}/{x}/{y}.png)')).toEqual([])
    expect(parseImageryUsed('Custom (tms:https://tiles.example/{z}/{x}/{y}.png)')).toEqual([])
    expect(parseImageryUsed('Custom')).toEqual([])
    expect(parseImageryUsed('https://tiles.example/{z}/{x}/{y}.png')).toEqual([])
    expect(
      parseImageryUsed('Custom (https://x.example/{z}/{x}/{y}.png);Bing aerial imagery'),
    ).toEqual(['Bing aerial imagery'])
  })

  it('does not drop a name that only starts with the letters of custom', () => {
    expect(parseImageryUsed('Customs Map Berlin')).toEqual(['Customs Map Berlin'])
  })
})

describe('normalizeImageryName', () => {
  it('ignores case, spacing and quote style', () => {
    expect(normalizeImageryName('  Bing   AERIAL\timagery ')).toBe('bing aerial imagery')
    expect(normalizeImageryName('mapper’s delight')).toBe("mapper's delight")
  })
})

describe('built-in backgrounds', () => {
  it.each([
    ['Bing aerial imagery', 'bing'],
    ['Bing Maps Aerial', 'bing'],
    ['  bing AERIAL imagery  ', 'bing'],
    ['bing', 'bing'],
    ['Esri World Imagery', 'esri'],
    ['EsriWorldImagery', 'esri'],
    ['Esri World Imagery (Clarity) Beta', 'esri-clarity'],
    ['OpenStreetMap (Standard)', 'carto'],
    ['OpenStreetMap Carto', 'carto'],
  ])('maps %s to %s', (value, id) => {
    expect(matchBuiltinStyleId(value)).toBe(id)
    expect(matchImageryUsedStyleId(value, layers)).toBe(id)
  })

  it('answers the built-in layer rather than the indexed twin', () => {
    expect(styleIds('Esri World Imagery')).toEqual(['esri'])
    expect(styleIds('OpenStreetMap (Standard)')).toEqual(['carto'])
  })

  it('knows the indexed twins of the built-in layers', () => {
    expect(isDuplicateOfBuiltinLayer({ id: 'EsriWorldImagery', name: 'x', overlay: false })).toBe(
      true,
    )
    expect(
      isDuplicateOfBuiltinLayer({ id: 'MAPNIK', name: 'OpenStreetMap (Standard)', overlay: false }),
    ).toBe(true)
    expect(isDuplicateOfBuiltinLayer(layers[0]!)).toBe(false)
  })
})

describe('indexed backgrounds', () => {
  it('matches the iD name, ignoring case and spaces', () => {
    expect(styleIds('Berlin/Geoportal DOP20RGB (2025)')).toEqual(['eli:Berlin-2025'])
    expect(styleIds('  berlin/geoportal   dop20rgb (2025)  ')).toEqual(['eli:Berlin-2025'])
  })

  it('tells the dates of a series apart', () => {
    expect(styleIds('Berlin/Geoportal DOP20RGB (2022)')).toEqual(['eli:Berlin-2022'])
    expect(styleIds('Berlin/Geoportal DOP20RGB (2025) Sommer')).toEqual(['eli:Berlin-2025-Summer'])
  })

  it('matches by layer id as well', () => {
    expect(styleIds('Berlin-2025')).toEqual(['eli:Berlin-2025'])
  })

  it('matches a name with a comma', () => {
    expect(styleIds('Berlin/Geoportal Baumbestand, Alkis s/w')).toEqual([
      'eli:Berlin-Baumbestand_Alkis',
    ])
  })

  it('lists every layer of a name that two layers share', () => {
    expect(styleIds('PNOA Spain')).toEqual(['eli:PNOA-a', 'eli:PNOA-b'])
  })

  it('never matches overlays or layers that need an API key', () => {
    expect(styleIds('Mapillary Images')).toEqual([])
    expect(styleIds('OpenStreetMap GPS traces')).toEqual([])
    const mapbox = resolveImageryUsed('Mapbox Satellite', layers)
    expect(mapbox.matches).toEqual([])
    expect(mapbox.unmatched).toEqual(['Mapbox Satellite'])
  })

  it('does not match a name that merely starts or ends like a layer', () => {
    expect(styleIds('Berlin')).toEqual([])
    expect(styleIds('Esri World')).toEqual([])
    expect(styleIds('Esri World Imagery Beta Preview')).toEqual([])
  })
})

describe('several entries', () => {
  it('keeps the order of the tag and drops repeats', () => {
    expect(
      styleIds(
        'Berlin/Geoportal DOP20RGB (2025);Bing aerial imagery;Mapillary Images;Bing Maps Aerial;Esri World Imagery',
      ),
    ).toEqual(['eli:Berlin-2025', 'bing', 'esri'])
  })

  it('chooses the first entry that has a background', () => {
    expect(
      matchImageryUsedSelection(
        'Custom (https://x.example/{z}/{x}/{y});Esri World Imagery',
        layers,
      ),
    ).toEqual({ styleId: 'esri', label: 'Esri World Imagery', token: 'Esri World Imagery' })
    expect(matchImageryUsedSelection('Not reported', layers)).toBe(null)
    expect(matchImageryUsedStyleId(undefined, layers)).toBe(null)
  })

  it('tries a plain comma list when the entry as a whole matches nothing', () => {
    expect(styleIds('Bing aerial imagery, Esri World Imagery')).toEqual(['bing', 'esri'])
  })

  it('reports what it could not match', () => {
    const resolved = resolveImageryUsed('Bing aerial imagery;Some Local Orthophoto 1987', layers)
    expect(resolved.tokens).toEqual(['Bing aerial imagery', 'Some Local Orthophoto 1987'])
    expect(resolved.unmatched).toEqual(['Some Local Orthophoto 1987'])
  })
})

describe('another date of a series', () => {
  it('finds the series when the named date is no longer in the index', () => {
    const resolved = resolveImageryUsed('Berlin/Geoportal DOP20RGB (2016)', layers)
    expect(resolved.matches).toEqual([])
    expect(resolved.similar.map((match) => match.styleId)).toEqual([
      'eli:Berlin-2022',
      'eli:Berlin-2025',
      'eli:Berlin-2025-Summer',
    ])
    expect(resolved.unmatched).toEqual([])
    expect(matchImageryUsedStyleId('Berlin/Geoportal DOP20RGB (2016)', layers)).toBe(null)
  })

  it('does not call a layer similar when another entry names it exactly', () => {
    const resolved = resolveImageryUsed(
      'Berlin/Geoportal DOP20RGB (2016);Berlin/Geoportal DOP20RGB (2025)',
      layers,
    )
    expect(resolved.matches.map((match) => match.styleId)).toEqual(['eli:Berlin-2025'])
    expect(resolved.similar.map((match) => match.styleId)).toEqual([
      'eli:Berlin-2022',
      'eli:Berlin-2025-Summer',
    ])
  })

  it('builds the same key for the dates of one series', () => {
    const key = imageryNameSeriesKey('Berlin/Geoportal DOP20RGB (2022)')
    expect(key).toBe('berlin/geoportal dop20rgb')
    expect(imageryNameSeriesKey('Berlin/Geoportal DOP20RGB (2025) Sommer')).toBe(key)
    expect(imageryNameSeriesKey('Berlin/Geoportal DOP20RGB')).toBe(key)
    expect(imageryNameSeriesKey('Maxar Premium Imagery (Beta)')).toBe('maxar premium imagery')
    expect(imageryNameSeriesKey('Brandenburg 2014-2016')).toBe('brandenburg')
  })
})

describe('with the bundled Editor Layer Index', () => {
  const index = getLayers()

  it('finds the names iD writes for Berlin imagery', () => {
    const resolved = resolveImageryUsed(
      'Berlin/Geoportal DOP20RGB (2025);Berlin/Geoportal DOP20RGB (2025) Sommer;Mapillary Images',
      index,
    )
    expect(resolved.matches.map((match) => match.styleId)).toEqual([
      'eli:Berlin-2025',
      'eli:Berlin-2025-Summer',
    ])
  })

  it('finds a name with a comma and lets the built-in layers win', () => {
    expect(matchImageryUsedStyleId('Berlin/Geoportal Baumbestand, Alkis s/w', index)).toBe(
      'eli:Berlin-Baumbestand_Alkis',
    )
    expect(matchImageryUsedStyleId('Esri World Imagery', index)).toBe('esri')
    expect(matchImageryUsedStyleId('Esri World Imagery (Clarity) Beta', index)).toBe('esri-clarity')
    expect(matchImageryUsedStyleId('OpenStreetMap (Standard)', index)).toBe('carto')
    expect(matchImageryUsedStyleId('OpenStreetMap (German Style)', index)).toBe(
      'eli:osm-mapnik-german_style',
    )
  })

  it('does not choose a background for custom or unknown imagery', () => {
    expect(matchImageryUsedStyleId('Custom (https://a.example/{z}/{x}/{y}.png)', index)).toBe(null)
    expect(matchImageryUsedStyleId('Not reported', index)).toBe(null)
    expect(matchImageryUsedStyleId('Mapbox Satellite', index)).toBe(null)
  })
})
