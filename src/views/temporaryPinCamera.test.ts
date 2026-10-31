import { describe, expect, test } from 'vitest'
import { panToKeepVisible } from './temporaryPinCamera.ts'

describe('panToKeepVisible', () => {
  const map = { width: 400, panelTop: 300 }

  test('leaves a point alone that shows above the panel', () => {
    expect(panToKeepVisible({ x: 200, y: 150 }, map)).toBeNull()
  })

  test('moves a point behind the panel up into the free part', () => {
    expect(panToKeepVisible({ x: 200, y: 500 }, map)).toEqual([0, 500 - (64 + 268) / 2])
  })

  test('moves a point under the top buttons down, and one off the side inward', () => {
    expect(panToKeepVisible({ x: 200, y: 10 }, map)).toEqual([0, 10 - 166])
    expect(panToKeepVisible({ x: 5, y: 150 }, map)).toEqual([5 - 200, 0])
  })
})
