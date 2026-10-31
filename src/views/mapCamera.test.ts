import { describe, expect, test } from 'vitest'
import { cameraProjection, referenceZoomOf, type MapCamera } from './mapCamera.ts'

const camera: MapCamera = { zoom: 18, lng: 13.4355, lat: 52.49749 }

describe('cameraProjection', () => {
  test('the center of the camera is the origin', () => {
    const { project } = cameraProjection(camera)

    expect(project([camera.lng, camera.lat])).toEqual({ x: 0, y: 0 })
  })

  test('east is right, north is up, and one zoom level doubles distances', () => {
    const near = cameraProjection(camera).project([camera.lng + 0.0001, camera.lat + 0.0001])
    const zoomed = cameraProjection({ ...camera, zoom: 19 }).project([
      camera.lng + 0.0001,
      camera.lat + 0.0001,
    ])

    expect(near.x).toBeGreaterThan(0)
    expect(near.y).toBeLessThan(0)
    expect(zoomed.x).toBeCloseTo(near.x * 2, 6)
    expect(zoomed.y).toBeCloseTo(near.y * 2, 6)
  })

  test('unproject undoes project', () => {
    const { project, unproject } = cameraProjection(camera)
    const [lng, lat] = unproject(project([13.4361, 52.4971]))

    expect(lng).toBeCloseTo(13.4361, 9)
    expect(lat).toBeCloseTo(52.4971, 9)
  })
})

describe('referenceZoomOf', () => {
  test('a group that fits is computed at zoom 18.5, a point too', () => {
    expect(referenceZoomOf({ west: 13.4353, south: 52.4974, east: 13.4355, north: 52.4975 })).toBe(
      18.5,
    )
    expect(referenceZoomOf({ west: 13.4, south: 52.4, east: 13.4, north: 52.4 })).toBe(18.5)
  })

  test('a large group gets the highest zoom at which it is 2500 pixels across', () => {
    const box = { west: 13.3, south: 52.4, east: 13.6, north: 52.45 }
    const zoom = referenceZoomOf(box)
    const { project } = cameraProjection({ zoom, lng: box.west, lat: box.north })

    expect(zoom).toBeLessThan(18.5)
    expect(project([box.east, box.south]).x).toBeCloseTo(2500, 6)
  })
})
