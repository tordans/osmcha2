import { describe, expect, test } from 'vitest'
import { detectInput } from './device.ts'

describe('detectInput', () => {
  test('a fine pointer is a keyboard', () => {
    expect(detectInput({ finePointer: true, maxTouchPoints: 0 })).toBe('keyboard')
  })

  test('a laptop with a touch screen still has its trackpad', () => {
    expect(detectInput({ finePointer: true, maxTouchPoints: 10 })).toBe('keyboard')
  })

  test('an iPad or a phone without a trackpad is touch', () => {
    expect(detectInput({ finePointer: false, maxTouchPoints: 5 })).toBe('touch')
  })

  test('without the media query, touch points decide', () => {
    expect(detectInput({ maxTouchPoints: 5 })).toBe('touch')
    expect(detectInput({})).toBe('keyboard')
  })

  test('?device= overrides it', () => {
    expect(detectInput({ finePointer: true, search: '?device=touch' })).toBe('touch')
    expect(detectInput({ finePointer: false, search: '?x=1&device=keyboard' })).toBe('keyboard')
    expect(detectInput({ finePointer: true, search: '?device=phone' })).toBe('keyboard')
  })
})
