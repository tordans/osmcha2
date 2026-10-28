import { describe, expect, it } from 'vitest'
import { countryPrefixOfValue, isTrafficSignKey, trafficSignValueOfRow } from './trafficSignRows.ts'

describe('isTrafficSignKey', () => {
  it.each([
    'traffic_sign',
    'traffic_sign:forward',
    'traffic_sign:backward',
    'traffic_sign:2',
    'parking:left:traffic_sign',
    'maxspeed:traffic_sign',
    'traffic_sign:forward:maxspeed',
  ])('matches %s', (key) => {
    expect(isTrafficSignKey(key)).toBe(true)
  })

  it.each([
    'traffic_signal',
    'traffic_signs',
    'traffic_sign_extra',
    'maxspeed',
    'highway',
    'traffic_signals:direction',
    'traffic',
    '',
  ])('does not match %s', (key) => {
    expect(isTrafficSignKey(key)).toBe(false)
  })
})

describe('trafficSignValueOfRow', () => {
  it('reads the value of added, unchanged and removed rows', () => {
    for (const kind of ['added', 'unchanged', 'removed'] as const) {
      expect(trafficSignValueOfRow({ kind, key: 'traffic_sign', value: 'DE:314' })).toBe('DE:314')
    }
  })

  it('reads the new value of a changed row', () => {
    expect(
      trafficSignValueOfRow({
        kind: 'changed',
        key: 'traffic_sign:forward',
        oldValue: 'DE:274[30]',
        newValue: 'DE:274[50]',
      }),
    ).toBe('DE:274[50]')
  })

  it('prefers the raw value over a rendered one', () => {
    expect(
      trafficSignValueOfRow({
        kind: 'unchanged',
        key: 'traffic_sign',
        value: { rendered: true },
        rawValue: 'DE:314',
      }),
    ).toBe('DE:314')
    expect(
      trafficSignValueOfRow({
        kind: 'changed',
        key: 'traffic_sign',
        newValue: { rendered: true },
        rawNew: 'DE:314',
      }),
    ).toBe('DE:314')
  })

  it('ignores other keys, empty values and values that are not text', () => {
    expect(trafficSignValueOfRow({ kind: 'added', key: 'maxspeed', value: 'DE:314' })).toBe(
      undefined,
    )
    expect(trafficSignValueOfRow({ kind: 'added', key: 'traffic_sign', value: '  ' })).toBe(
      undefined,
    )
    expect(trafficSignValueOfRow({ kind: 'added', key: 'traffic_sign', value: {} })).toBe(undefined)
  })
})

describe('countryPrefixOfValue', () => {
  const countries = ['DE', 'AT', 'FR']

  it('reads the prefix of the value', () => {
    expect(countryPrefixOfValue('DE:314,1044-11')).toBe('DE')
    expect(countryPrefixOfValue('AT:274[30];AT:1020-30', countries)).toBe('AT')
    expect(countryPrefixOfValue(' de:314', countries)).toBe('DE')
  })

  it('shows nothing without a prefix or with an unknown one', () => {
    expect(countryPrefixOfValue('314,1044-11')).toBe(undefined)
    expect(countryPrefixOfValue('274[30]', countries)).toBe(undefined)
    expect(countryPrefixOfValue('XX:314', countries)).toBe(undefined)
    expect(countryPrefixOfValue('DEU:314', countries)).toBe(undefined)
    expect(countryPrefixOfValue('')).toBe(undefined)
  })
})
