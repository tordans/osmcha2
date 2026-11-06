import { describe, expect, it } from 'vitest'
import numberWithCommas from './number_with_commas.ts'

describe('numberWithCommas', () => {
  it('groups thousands', () => {
    expect(numberWithCommas(0)).toBe('0')
    expect(numberWithCommas(999)).toBe('999')
    expect(numberWithCommas(1234567)).toBe('1,234,567')
    expect(numberWithCommas(-1234)).toBe('-1,234')
  })

  it('does not group digits after the decimal point', () => {
    expect(numberWithCommas(1234.5678)).toBe('1,234.5678')
  })
})
