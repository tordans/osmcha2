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
