import { describe, expect, test } from 'vitest'
import { isOsmElementType, objectRefKey } from './osmElement.ts'

describe('objectRefKey', () => {
  test('joins type and id', () => {
    expect(objectRefKey('way', 123)).toBe('way/123')
    expect(objectRefKey('node', 1)).toBe('node/1')
  })
})

describe('isOsmElementType', () => {
  test('accepts the three element types only', () => {
    expect(isOsmElementType('node')).toBe(true)
    expect(isOsmElementType('way')).toBe(true)
    expect(isOsmElementType('relation')).toBe(true)
    expect(isOsmElementType('changeset')).toBe(false)
  })
})
