import { describe, expect, it } from 'vitest'
import {
  isDuplicateOfBuiltinLayer,
  isImageryUsedMatch,
  matchBuiltinStyleId,
  matchImageryUsedStyleId,
  parseImageryUsed,
} from './matchImageryUsed.ts'

const eliLayers = [
  { id: 'Maxar-Premium', name: 'Maxar Premium Imagery', overlay: false },
  { id: 'EsriWorldImagery', name: 'Esri World Imagery', overlay: false },
  { id: 'Mapillary', name: 'Mapillary Images', overlay: true },
  { id: 'Berlin-Geoportal', name: 'Berlin Geoportal Aerial', overlay: false },
]

describe('parseImageryUsed', () => {
  it('splits iD semicolon lists and drops street-level and empty tokens', () => {
    expect(parseImageryUsed('Bing Maps Aerial;Mapillary Images;Maxar Premium Imagery')).toEqual([
      'Bing Maps Aerial',
      'Maxar Premium Imagery',
    ])
  })

  it('ignores Not reported and custom URLs', () => {
    expect(parseImageryUsed('Not reported')).toEqual([])
    expect(parseImageryUsed('https://tiles.example/{z}/{x}/{y}.png')).toEqual([])
  })
})

describe('matchImageryUsedStyleId', () => {
  it('prefers the built-in Bing and Esri layers', () => {
    expect(matchImageryUsedStyleId('Bing Maps Aerial', eliLayers)).toBe('bing')
    expect(matchImageryUsedStyleId('EsriWorldImagery', eliLayers)).toBe('esri')
    expect(matchBuiltinStyleId('Esri World Imagery (Clarity) Beta')).toBe('esri-clarity')
  })

  it('matches ELI display names, including dated suffixes', () => {
    expect(matchImageryUsedStyleId('Maxar Premium Imagery (Maxar 2024)', eliLayers)).toBe(
      'eli:Maxar-Premium',
    )
    expect(matchImageryUsedStyleId('Berlin Geoportal Aerial', eliLayers)).toBe(
      'eli:Berlin-Geoportal',
    )
  })

  it('skips overlay sources and returns null when nothing matches', () => {
    expect(matchImageryUsedStyleId('Mapillary Images', eliLayers)).toBe(null)
    expect(matchImageryUsedStyleId('Not reported', eliLayers)).toBe(null)
  })
})

describe('isImageryUsedMatch', () => {
  it('marks the changeset imagery name', () => {
    expect(isImageryUsedMatch('Bing Maps Aerial;Mapillary', 'Bing Maps Aerial')).toBe(true)
    expect(isImageryUsedMatch('Maxar Premium Imagery', 'Esri World Imagery')).toBe(false)
  })
})

describe('isDuplicateOfBuiltinLayer', () => {
  it('hides ELI rows already offered as defaults', () => {
    expect(
      isDuplicateOfBuiltinLayer({
        id: 'EsriWorldImagery',
        name: 'Esri World Imagery',
        overlay: false,
      }),
    ).toBe(true)
    expect(
      isDuplicateOfBuiltinLayer({
        id: 'Maxar-Premium',
        name: 'Maxar Premium Imagery',
        overlay: false,
      }),
    ).toBe(false)
  })
})
