import { describe, expect, test } from 'vitest'
import { editorShortname } from './editorShortname.ts'

describe('editorShortname', () => {
  test('returns Unknown when the editor string is missing', () => {
    expect(editorShortname(null)).toBe('Unknown')
    expect(editorShortname(undefined)).toBe('Unknown')
    expect(editorShortname('')).toBe('Unknown')
  })

  test('maps common created_by / editor strings', () => {
    expect(editorShortname('JOSM/1.5 (Windows)')).toBe('JOSM')
    expect(editorShortname('StreetComplete 58.2')).toBe('StreetComplete')
    expect(editorShortname('Every Door 5.0')).toBe('Every Door')
    expect(editorShortname('iD 2.27.0')).toBe('iD')
    expect(editorShortname('RapiD 1.2')).toBe('Rapid')
    expect(editorShortname('Go Map!! 2.0')).toBe('GoMap')
    expect(editorShortname('Vespucci 19.1')).toBe('Vespucci')
    expect(editorShortname('OsmAnd+ 4.7')).toBe('OsmAnd')
  })

  test('falls back to the first word when unrecognised', () => {
    expect(editorShortname('Potlatch 2')).toBe('Potlatch')
  })
})
