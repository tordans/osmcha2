import { describe, expect, test } from 'vitest'
import { changesetCameraIntent, changesetFitPadding } from './changesetCamera.ts'

describe('changesetCameraIntent', () => {
  test('fits when the URL has no map camera', () => {
    expect(changesetCameraIntent(undefined)).toEqual({ type: 'fit' })
    expect(changesetCameraIntent('')).toEqual({ type: 'fit' })
  })

  test('restores an explicit map camera', () => {
    expect(changesetCameraIntent('15/52.5/13.4')).toEqual({
      type: 'restore',
      camera: { zoom: 15, lat: 52.5, lng: 13.4 },
    })
  })
})

describe('changesetFitPadding', () => {
  test('returns null until the container has a real size', () => {
    expect(changesetFitPadding(0, 800)).toBeNull()
    expect(changesetFitPadding(400, 0)).toBeNull()
  })

  test('stays smaller than half the short side so cameraForBounds can succeed', () => {
    const padding = changesetFitPadding(360, 420)
    expect(padding).not.toBeNull()
    expect(padding!).toBeLessThan(360 / 2)
    expect(padding!).toBeLessThanOrEqual(80)
  })

  test('uses a modest padding on a large pane instead of 200px', () => {
    expect(changesetFitPadding(1200, 900)).toBe(80)
  })
})
