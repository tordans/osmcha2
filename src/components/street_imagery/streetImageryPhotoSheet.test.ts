import { describe, expect, it } from 'vitest'
import { snapToMini } from './streetImageryPhotoSheet.ts'

describe('snapToMini', () => {
  it('goes to the nearer stop on a slow drag', () => {
    expect(snapToMini({ offset: 100, velocity: 0, miniOffset: 400 })).toBe(false)
    expect(snapToMini({ offset: 300, velocity: 0, miniOffset: 400 })).toBe(true)
  })

  it('follows a flick, wherever it ends', () => {
    expect(snapToMini({ offset: 50, velocity: 900, miniOffset: 400 })).toBe(true)
    expect(snapToMini({ offset: 350, velocity: -900, miniOffset: 400 })).toBe(false)
  })
})
