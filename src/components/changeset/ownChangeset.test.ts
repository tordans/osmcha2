import { describe, expect, test } from 'vitest'
import { isOwnChangeset } from './ownChangeset.ts'

describe('isOwnChangeset', () => {
  test('signed out is never own', () => {
    expect(isOwnChangeset(undefined, { username: 'a', uid: 1 })).toBe(false)
  })

  test('matches by uid, whatever its type', () => {
    expect(isOwnChangeset({ username: 'new name', uid: 42 }, { username: 'old', uid: '42' })).toBe(
      true,
    )
    expect(isOwnChangeset({ username: 'a', uid: 42 }, { username: 'a', uid: 43 })).toBe(false)
  })

  test('falls back to the name without a uid', () => {
    expect(isOwnChangeset({ username: 'a', uid: null }, { username: 'a', uid: 7 })).toBe(true)
    expect(isOwnChangeset({ username: 'a', uid: 1 }, { username: 'b' })).toBe(false)
    expect(isOwnChangeset({ username: '' }, { username: '' })).toBe(false)
  })
})
