import type { Map } from 'maplibre-gl'
import { describe, expect, test } from 'vitest'
import { CHANGESET_OVERLAY_BG_LAYER_ID } from './changesetAdiffViewer.ts'
import {
  applySeenMapStyle,
  changesetFeaturePassesReviewFilter,
  featureIsSeen,
  grayPaintIfSeen,
  passesReviewFilter,
  reviewVisibilityPaint,
  SEEN_MAP_HEX,
  syncSeenFeatureState,
} from './changesetSeenStyle.ts'

describe('featureIsSeen', () => {
  const seenMap = { 'way/10': '2026-01-01T00:00:00Z' }

  test('matches type/id keys in the seen map', () => {
    expect(featureIsSeen({ type: 'way', id: 10 }, seenMap)).toBe(true)
    expect(featureIsSeen({ type: 'way', id: 11 }, seenMap)).toBe(false)
    expect(featureIsSeen({ type: 'node', id: 10 }, seenMap)).toBe(false)
    expect(featureIsSeen({ type: 'way', id: 10 }, undefined)).toBe(false)
  })
})

describe('passesReviewFilter', () => {
  test('hides the side that is toggled off', () => {
    expect(passesReviewFilter(true, true, true)).toBe(true)
    expect(passesReviewFilter(false, true, true)).toBe(true)
    expect(passesReviewFilter(true, false, true)).toBe(false)
    expect(passesReviewFilter(false, true, false)).toBe(false)
    expect(passesReviewFilter(true, false, false)).toBe(false)
  })
})

describe('changesetFeaturePassesReviewFilter', () => {
  const seenMap = { 'way/10': '2026-01-01T00:00:00Z' }

  test('always keeps non-changeset sources such as spyglass', () => {
    expect(
      changesetFeaturePassesReviewFilter(
        { source: 'spyglass', properties: { type: 'way', id: 10 } },
        seenMap,
        false,
        true,
      ),
    ).toBe(true)
  })

  test('filters changeset features by seen state', () => {
    expect(
      changesetFeaturePassesReviewFilter(
        { source: 'changeset', properties: { type: 'way', id: 10 } },
        seenMap,
        false,
        true,
      ),
    ).toBe(false)
    expect(
      changesetFeaturePassesReviewFilter(
        { source: 'changeset', properties: { type: 'way', id: 11 } },
        seenMap,
        false,
        true,
      ),
    ).toBe(true)
  })
})

describe('applySeenMapStyle', () => {
  const way = {
    id: 'changeset-way-new',
    type: 'line' as const,
    paint: { 'line-color': '#2dd4bf', 'line-width': 2 },
  }

  test('grays action colors when the feature is seen', () => {
    const [styled] = applySeenMapStyle([way], { showSeen: true, showUnseen: true, graySeen: true })
    expect(styled?.paint?.['line-color']).toEqual(grayPaintIfSeen('#2dd4bf'))
    expect(styled?.paint?.['line-width']).toBe(2)
    expect(styled?.paint?.['line-opacity']).toEqual(
      reviewVisibilityPaint(undefined, true, true, true),
    )
  })

  test('hides seen geometry when the seen filter is off', () => {
    const [styled] = applySeenMapStyle([way], { showSeen: false, showUnseen: true, graySeen: true })
    expect(styled?.paint?.['line-opacity']).toEqual(
      reviewVisibilityPaint(undefined, false, true, true),
    )
  })

  test('does not gray emphasis colors, but still hides filtered features', () => {
    const halo = {
      id: 'changeset-emphasis-way',
      type: 'line' as const,
      paint: { 'line-color': 'hsl(45 93% 47%)', 'line-opacity': 0.92 },
    }
    const [styled] = applySeenMapStyle([halo], {
      showSeen: false,
      showUnseen: true,
      graySeen: false,
    })
    expect(styled?.paint?.['line-color']).toBe('hsl(45 93% 47%)')
    expect(styled?.paint?.['line-opacity']).toEqual(reviewVisibilityPaint(0.92, false, true, false))
  })

  test('leaves the overlay background alone', () => {
    const overlay = {
      id: CHANGESET_OVERLAY_BG_LAYER_ID,
      type: 'background' as const,
      paint: { 'background-color': 'hsla(0, 0%, 0%, 0.5)' },
    }
    expect(
      applySeenMapStyle([overlay], { showSeen: true, showUnseen: true, graySeen: true })[0],
    ).toEqual(overlay)
  })
})

describe('grayPaintIfSeen', () => {
  test('wraps the original color behind feature-state seen', () => {
    expect(grayPaintIfSeen('#2dd4bf')).toEqual([
      'case',
      ['boolean', ['feature-state', 'seen'], false],
      SEEN_MAP_HEX,
      '#2dd4bf',
    ])
  })
})

describe('syncSeenFeatureState', () => {
  test('sets seen true only for keys in the seen map', () => {
    const calls: Array<{ id: string | number; state: object }> = []
    const map = {
      getSource: () => ({}),
      setFeatureState: (_ref: { id: string | number }, state: object) => {
        calls.push({ id: _ref.id, state })
      },
    } as unknown as Map

    syncSeenFeatureState(
      map,
      {
        features: [
          { id: 1, properties: { type: 'way', id: 10 } },
          { id: 2, properties: { type: 'node', id: 11 } },
        ],
      },
      { 'way/10': '2026-01-01T00:00:00Z' },
    )

    expect(calls).toEqual([
      { id: 1, state: { seen: true } },
      { id: 2, state: { seen: false } },
    ])
  })

  test('no-ops until the changeset source exists', () => {
    const map = {
      getSource: () => undefined,
      setFeatureState: () => {
        throw new Error('source missing')
      },
    } as unknown as Map

    expect(() =>
      syncSeenFeatureState(map, { features: [{ id: 1, properties: { type: 'way', id: 10 } }] }, {}),
    ).not.toThrow()
  })
})
