import { afterEach, describe, expect, test } from 'vitest'
import { isHardwareKey, watchHardwareKeys, withKeyHint, type KeyPress } from './hardwareKeys.ts'

function press(key: string, extra: Partial<KeyPress> = {}): KeyPress {
  return {
    key,
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    typing: false,
    ...extra,
  }
}

describe('isHardwareKey', () => {
  test('outside a text field every key is the hardware keyboard', () => {
    expect(isHardwareKey(press('s'))).toBe(true)
  })

  test('in a text field letters and Backspace may come from the on-screen keyboard', () => {
    expect(isHardwareKey(press('s', { typing: true }))).toBe(false)
    expect(isHardwareKey(press('Backspace', { typing: true }))).toBe(false)
    expect(isHardwareKey(press('Enter', { typing: true }))).toBe(false)
  })

  test('in a text field modifiers, Tab, arrows and Escape are the hardware keyboard', () => {
    expect(isHardwareKey(press('a', { typing: true, metaKey: true }))).toBe(true)
    expect(isHardwareKey(press('Tab', { typing: true }))).toBe(true)
    expect(isHardwareKey(press('ArrowDown', { typing: true }))).toBe(true)
    expect(isHardwareKey(press('Escape', { typing: true }))).toBe(true)
    expect(isHardwareKey(press('F5', { typing: true }))).toBe(true)
  })

  test('composing and unidentified keys are not', () => {
    expect(isHardwareKey(press('Unidentified'))).toBe(false)
    expect(isHardwareKey(press('Process'))).toBe(false)
    expect(isHardwareKey(press('a', { isComposing: true }))).toBe(false)
  })
})

describe('watchHardwareKeys', () => {
  const root = document.createElement('html')
  let stop = () => {}

  afterEach(() => {
    stop()
    delete root.dataset.keys
  })

  test('a fine pointer marks a keyboard at once', () => {
    stop = watchHardwareKeys(true, root)
    expect('keys' in root.dataset).toBe(true)
  })

  test('a touch device waits for its first hardware key', () => {
    stop = watchHardwareKeys(false, root)
    expect('keys' in root.dataset).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified' }))
    expect('keys' in root.dataset).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))
    expect('keys' in root.dataset).toBe(true)
  })
})

describe('withKeyHint', () => {
  test('names the key only with a keyboard', () => {
    expect(withKeyHint('Mark as seen', 'S', true)).toBe('Mark as seen (S)')
    expect(withKeyHint('Mark as seen', 'S', false)).toBe('Mark as seen')
  })
})
