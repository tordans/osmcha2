import { describe, expect, test } from 'vitest'
import { parsePinParam, serializePinParam } from './pinParam.ts'
import { routerSearch } from './routerSearch.ts'

describe('pinParam', () => {
  test('round-trips lat,lng to five decimals', () => {
    const input = { lat: 52.52014123, lng: 13.40520999 }
    const serialized = serializePinParam(input)
    expect(serialized).toBe('52.52014,13.40521')
    expect(parsePinParam(serialized)).toEqual({ lat: 52.52014, lng: 13.40521 })
  })

  test('keeps commas readable in serialized pin values', () => {
    const serialized = serializePinParam({ lat: 52.52014, lng: 13.40521 })
    const stringified = routerSearch.stringify({ pin: serialized })
    expect(stringified).toContain('pin=')
    expect(stringified).toContain('52.52014,13.40521')
    expect(stringified).not.toContain('%2C')
  })

  test('rejects empty, wrong arity, out of range, and non-numeric values', () => {
    expect(parsePinParam('')).toBeNull()
    expect(parsePinParam('52.5')).toBeNull()
    expect(parsePinParam('52.5,13.4,1')).toBeNull()
    expect(parsePinParam('52.5,')).toBeNull()
    expect(parsePinParam(',13.4')).toBeNull()
    expect(parsePinParam('91,13.4')).toBeNull()
    expect(parsePinParam('-91,13.4')).toBeNull()
    expect(parsePinParam('52.5,181')).toBeNull()
    expect(parsePinParam('52.5,-181')).toBeNull()
    expect(parsePinParam('lat,lng')).toBeNull()
    expect(parsePinParam('52.5,east')).toBeNull()
  })

  test('accepts inclusive range bounds', () => {
    expect(parsePinParam('90,-180')).toEqual({ lat: 90, lng: -180 })
    expect(parsePinParam('-90,180')).toEqual({ lat: -90, lng: 180 })
  })
})
