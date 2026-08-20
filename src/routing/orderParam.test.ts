import { describe, expect, it } from 'vitest'
import {
  apiOrderFromUnknown,
  apiOrderToSearchParam,
  parseApiOrder,
  searchParamToApiOrder,
} from './orderParam.ts'

describe('parseApiOrder', () => {
  it('reads ascending and descending Django values', () => {
    expect(parseApiOrder('date')).toEqual({ field: 'date', direction: 'asc' })
    expect(parseApiOrder('-date')).toEqual({ field: 'date', direction: 'desc' })
    expect(parseApiOrder('-comments_count')).toEqual({
      field: 'comments_count',
      direction: 'desc',
    })
  })

  it('rejects unknown fields', () => {
    expect(parseApiOrder('id')).toBeNull()
    expect(parseApiOrder('-user')).toBeNull()
    expect(parseApiOrder('date,desc')).toBeNull()
  })
})

describe('apiOrderToSearchParam / searchParamToApiOrder', () => {
  it('round-trips field and direction', () => {
    expect(apiOrderToSearchParam('-date')).toBe('date,desc')
    expect(apiOrderToSearchParam('date')).toBe('date,asc')
    expect(apiOrderToSearchParam('-check_date')).toBe('check_date,desc')
    expect(searchParamToApiOrder('date,desc')).toBe('-date')
    expect(searchParamToApiOrder('date,asc')).toBe('date')
    expect(searchParamToApiOrder('check_date,desc')).toBe('-check_date')
  })

  it('rejects malformed URL values', () => {
    expect(searchParamToApiOrder('date')).toBeUndefined()
    expect(searchParamToApiOrder('date|desc')).toBeUndefined()
    expect(searchParamToApiOrder('-date')).toBeUndefined()
    expect(searchParamToApiOrder('date,desc,extra')).toBeUndefined()
    expect(searchParamToApiOrder('id,desc')).toBeUndefined()
    expect(searchParamToApiOrder(undefined)).toBeUndefined()
  })
})

describe('apiOrderFromUnknown', () => {
  it('accepts a Django string or a {label,value} filter row', () => {
    expect(apiOrderFromUnknown('-modify')).toBe('-modify')
    expect(apiOrderFromUnknown([{ label: 'Descending Date', value: '-date' }])).toBe('-date')
  })

  it('ignores unrelated values', () => {
    expect(apiOrderFromUnknown('date,desc')).toBeUndefined()
    expect(apiOrderFromUnknown([{ label: 'x', value: 'nope' }])).toBeUndefined()
    expect(apiOrderFromUnknown(null)).toBeUndefined()
  })
})
