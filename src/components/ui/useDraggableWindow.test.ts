import { describe, expect, test } from 'vitest'
import { clampWindowPosition } from './useDraggableWindow.ts'

describe('clampWindowPosition', () => {
  const window = { width: 500, height: 400 }
  const screen = { width: 1000, height: 800 }

  test('leaves a place on screen as it is', () => {
    expect(clampWindowPosition({ left: 100, top: 50 }, window, screen)).toEqual({
      left: 100,
      top: 50,
    })
  })

  test('keeps a fifth of the width on screen on both sides', () => {
    expect(clampWindowPosition({ left: -900, top: 50 }, window, screen).left).toBe(-400)
    expect(clampWindowPosition({ left: 2000, top: 50 }, window, screen).left).toBe(900)
  })

  test('keeps a fifth of the height at the bottom', () => {
    expect(clampWindowPosition({ left: 0, top: 2000 }, window, screen).top).toBe(720)
  })

  test('never goes over the top, where the header is', () => {
    expect(clampWindowPosition({ left: 0, top: -300 }, window, screen).top).toBe(0)
  })
})
