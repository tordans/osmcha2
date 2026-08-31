import { describe, expect, test } from 'vitest'
import {
  changesetCameraIntent,
  changesetFitPadding,
  featuresToFitForNote,
  stagedFlyPlan,
} from './changesetCamera.ts'

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

describe('stagedFlyPlan', () => {
  test('uses a single fly when the zoom change is small', () => {
    expect(stagedFlyPlan(14, 15)).toEqual({ type: 'direct' })
    expect(stagedFlyPlan(16, 15)).toEqual({ type: 'direct' })
  })

  test('uses a continuous pan-then-zoom path for large zoom-ins', () => {
    expect(stagedFlyPlan(10, 16)).toEqual({ type: 'staged' })
    expect(stagedFlyPlan(12, 14)).toEqual({ type: 'staged' })
  })
})

describe('featuresToFitForNote', () => {
  const viewer = {
    geojson: {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { type: 'way', id: 1 },
          geometry: { type: 'Point' as const, coordinates: [13, 52] },
        },
      ],
    },
  }

  test('pin-only notes still produce a point to fit', () => {
    const features = featuresToFitForNote(viewer, null, { lat: 52.5, lng: 13.4 })
    expect(features).toHaveLength(1)
    expect(features[0]?.geometry).toEqual({ type: 'Point', coordinates: [13.4, 52.5] })
  })

  test('includes the object and the pin when both are present', () => {
    const features = featuresToFitForNote(viewer, { type: 'way', id: 1 }, { lat: 52.5, lng: 13.4 })
    expect(features).toHaveLength(2)
  })
})
