import { describe, expect, test } from 'vitest'
import { osmchaSearchSchema } from './searchSchemas.ts'

describe('aoi search param', () => {
  test('keeps saved-filter ids and drops anything that could change the API path', () => {
    expect(osmchaSearchSchema.parse({}).aoi).toBeUndefined()
    expect(osmchaSearchSchema.parse({ aoi: 123 }).aoi).toBe('123')
    expect(osmchaSearchSchema.parse({ aoi: '0f8e-12ab' }).aoi).toBe('0f8e-12ab')
    expect(osmchaSearchSchema.parse({ aoi: '../users/?x=' }).aoi).toBeUndefined()
  })
})

describe('string search params', () => {
  const keys = ['token', 'map', 'ref', 'pin', 'layers', 'order', 'code', 'state', 'group'] as const

  test.each(keys)('%s keeps strings and turns numbers into strings', (key) => {
    expect(osmchaSearchSchema.parse({ [key]: 'abc' })[key]).toBe('abc')
    expect(osmchaSearchSchema.parse({ [key]: 123 })[key]).toBe('123')
  })

  test.each(keys)('%s drops null, booleans, arrays and objects instead of throwing', (key) => {
    for (const value of [null, true, ['a', 'b'], { a: 1 }]) {
      expect(osmchaSearchSchema.safeParse({ [key]: value }).success).toBe(true)
      expect(osmchaSearchSchema.parse({ [key]: value })[key]).toBeUndefined()
    }
  })

  test('a duplicated key and a numeric ref do not break the page', () => {
    const parsed = osmchaSearchSchema.parse({ ref: 123, map: 3, layers: null, order: ['a', 'b'] })
    expect(parsed.ref).toBe('123')
    expect(parsed.map).toBe('3')
    expect(parsed.layers).toBeUndefined()
    expect(parsed.order).toBeUndefined()
  })
})
