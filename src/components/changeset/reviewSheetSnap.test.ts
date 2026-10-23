import { describe, expect, test } from 'vitest'
import { sheetCoveredHeight, sheetOffsets, snapSheetPosition } from './reviewSheetSnap.ts'

const offsets = sheetOffsets(800, 90)

describe('sheetOffsets', () => {
  test('puts list at 0, half in the middle and map so only the peek shows', () => {
    expect(offsets).toEqual({ list: 0, half: 400, map: 710 })
  })

  test('keeps half above map on a very short sheet', () => {
    expect(sheetOffsets(100, 80)).toEqual({ list: 0, half: 20, map: 20 })
  })

  test('never goes negative', () => {
    expect(sheetOffsets(40, 90)).toEqual({ list: 0, half: 0, map: 0 })
  })
})

describe('snapSheetPosition', () => {
  test('snaps a slow release to the nearest stop', () => {
    expect(snapSheetPosition({ offset: 120, velocity: 0, from: 'list', offsets })).toBe('list')
    expect(snapSheetPosition({ offset: 300, velocity: 100, from: 'list', offsets })).toBe('half')
    expect(snapSheetPosition({ offset: 650, velocity: -100, from: 'half', offsets })).toBe('map')
  })

  test('a flick moves one stop from where the drag started', () => {
    expect(snapSheetPosition({ offset: 40, velocity: 900, from: 'list', offsets })).toBe('half')
    expect(snapSheetPosition({ offset: 690, velocity: -900, from: 'map', offsets })).toBe('half')
    expect(snapSheetPosition({ offset: 380, velocity: -900, from: 'half', offsets })).toBe('list')
  })

  test('a flick past the last stop stays there', () => {
    expect(snapSheetPosition({ offset: 710, velocity: 1200, from: 'map', offsets })).toBe('map')
    expect(snapSheetPosition({ offset: 0, velocity: -1200, from: 'list', offsets })).toBe('list')
  })
})

describe('sheetCoveredHeight', () => {
  test('is the visible part of the sheet in the half position', () => {
    expect(sheetCoveredHeight('half', { sheetHeight: 800, offsets, cardHeight: 70 })).toBe(400)
  })

  test('adds the element card in the map position', () => {
    expect(sheetCoveredHeight('map', { sheetHeight: 800, offsets, cardHeight: 70 })).toBe(160)
    expect(sheetCoveredHeight('map', { sheetHeight: 800, offsets, cardHeight: 0 })).toBe(90)
  })
})
