import { describe, expect, test } from 'vitest'
import { numberPins } from './pinNumbers.ts'

describe('numberPins', () => {
  test('assigns view-local numbers in first-appearance order and dedupes published coordinates', () => {
    const numbered = numberPins([
      { pin: { lat: 52.5, lng: 13.4 } },
      { pin: { lat: 52.6, lng: 13.4 } },
      { pin: { lat: 52.5, lng: 13.4 } },
    ])
    expect(numbered).toEqual([
      { pin: { lat: 52.5, lng: 13.4 }, number: 1 },
      { pin: { lat: 52.6, lng: 13.4 }, number: 2 },
    ])
  })

  test('keeps a draft pin number when its coordinates change', () => {
    const first = numberPins([{ pin: { lat: 52.5, lng: 13.4 }, draft: true, id: 'n1' }])
    expect(first[0]?.number).toBe(1)
    const moved = numberPins([{ pin: { lat: 52.9, lng: 13.1 }, draft: true, id: 'n1' }])
    expect(moved[0]).toEqual({
      pin: { lat: 52.9, lng: 13.1 },
      number: 1,
      draft: true,
      id: 'n1',
    })
  })

  test('does not merge a draft onto a published pin at the same coordinates', () => {
    const numbered = numberPins([
      { pin: { lat: 52.5, lng: 13.4 } },
      { pin: { lat: 52.5, lng: 13.4 }, draft: true, id: 'n1' },
    ])
    expect(numbered).toHaveLength(2)
    expect(numbered[1]?.id).toBe('n1')
    expect(numbered[1]?.number).toBe(2)
  })
})
