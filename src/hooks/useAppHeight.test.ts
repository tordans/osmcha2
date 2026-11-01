import { describe, expect, test } from 'vitest'
import { keyboardMayBeOpen } from './useAppHeight.ts'

describe('keyboardMayBeOpen', () => {
  const field = document.createElement('textarea')
  const button = document.createElement('button')

  test('a text field on a touch device means the keyboard', () => {
    expect(keyboardMayBeOpen(field, true)).toBe(true)
  })

  test('other elements do not', () => {
    expect(keyboardMayBeOpen(button, true)).toBe(false)
    expect(keyboardMayBeOpen(null, true)).toBe(false)
  })

  test('with a mouse, a field in focus does not stop the height from following the window', () => {
    expect(keyboardMayBeOpen(field, false)).toBe(false)
  })
})
