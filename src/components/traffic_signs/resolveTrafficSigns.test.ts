import { describe, expect, it } from 'vitest'
import { resolveTrafficSigns } from './resolveTrafficSigns.ts'

describe('resolveTrafficSigns (real converter package)', () => {
  it('maps DE:314,1044-11 to two signs: the parking sign and the unknown 1044-11', async () => {
    const signs = await resolveTrafficSigns('DE:314,1044-11')
    expect(signs).toHaveLength(2)
    expect(signs[0]).toMatchObject({ id: '314', name: 'Parkplatz', recognized: true })
    expect(signs[0]?.svgUrl).toEqual(expect.any(String))
    expect(signs[1]).toEqual({ id: '1044-11', name: '1044-11', recognized: false })
  })

  it('keeps the order of the value and names a speed limit', async () => {
    const signs = await resolveTrafficSigns('DE:274[30];DE:1020-30')
    expect(signs.map((sign) => sign.id)).toEqual(['274-30', '1020-30'])
    expect(signs[1]?.name).toBe('Anlieger frei')
  })

  it('finds nothing without a known country prefix', async () => {
    expect(await resolveTrafficSigns('314,1044-11')).toEqual([])
    expect(await resolveTrafficSigns('XX:314')).toEqual([])
  })
})
