import { describe, expect, it } from 'vitest'
import {
  LIST_DEFAULT,
  LIST_MAX,
  LIST_MIN,
  MAP_MIN,
  REVIEW_DEFAULT,
  REVIEW_MAX,
  REVIEW_MIN,
  clampPreferredWidths,
  resizeSidePane,
} from './paneWidths.ts'

const WIDE = 1400

describe('resizeSidePane', () => {
  it('drags review +200 without moving list, shrinking the map', () => {
    const list = LIST_DEFAULT
    const review = resizeSidePane({
      side: 'review',
      delta: 200,
      available: WIDE,
      list,
      review: REVIEW_DEFAULT,
      hasReview: true,
    })

    expect(list).toBe(288)
    expect(review).toBe(584)
    expect(WIDE - list - review).toBe(528)
  })

  it('stops review at max 640 before the map hits min', () => {
    const list = LIST_DEFAULT
    const review = resizeSidePane({
      side: 'review',
      delta: 1000,
      available: WIDE,
      list,
      review: REVIEW_DEFAULT,
      hasReview: true,
    })

    expect(review).toBe(REVIEW_MAX)
    expect(list).toBe(288)
    expect(WIDE - list - review).toBe(472)
    expect(WIDE - list - review).toBeGreaterThan(MAP_MIN)
  })

  it('stops at map min 280 if review max were higher; list stays', () => {
    const list = LIST_DEFAULT
    const review = resizeSidePane({
      side: 'review',
      delta: 2000,
      available: WIDE,
      list,
      review: REVIEW_DEFAULT,
      hasReview: true,
      max: 2000,
    })

    expect(review).toBe(WIDE - list - MAP_MIN)
    expect(review).toBe(832)
    expect(list).toBe(288)
    expect(WIDE - list - review).toBe(MAP_MIN)
  })

  it('grows list from its handle without moving review', () => {
    const review = REVIEW_DEFAULT
    const list = resizeSidePane({
      side: 'list',
      delta: 80,
      available: WIDE,
      list: LIST_DEFAULT,
      review,
      hasReview: true,
    })

    expect(list).toBe(368)
    expect(review).toBe(384)
    expect(WIDE - list - review).toBe(648)
  })

  it('stops list at max 480 before the map hits min', () => {
    const review = REVIEW_DEFAULT
    const list = resizeSidePane({
      side: 'list',
      delta: 1000,
      available: WIDE,
      list: LIST_DEFAULT,
      review,
      hasReview: true,
    })

    expect(list).toBe(LIST_MAX)
    expect(review).toBe(384)
    expect(WIDE - list - review).toBeGreaterThan(MAP_MIN)
  })

  it('does not grow a side once the map is at min; far pane stays', () => {
    const list = resizeSidePane({
      side: 'list',
      delta: 40,
      available: WIDE,
      list: WIDE - REVIEW_DEFAULT - MAP_MIN,
      review: REVIEW_DEFAULT,
      hasReview: true,
      max: 2000,
    })

    expect(list).toBe(WIDE - REVIEW_DEFAULT - MAP_MIN)
    expect(REVIEW_DEFAULT).toBe(384)
  })
})

describe('clampPreferredWidths', () => {
  it('keeps preferred widths when the map still has slack', () => {
    expect(
      clampPreferredWidths({
        available: WIDE,
        list: LIST_DEFAULT,
        review: REVIEW_DEFAULT,
        hasReview: true,
      }),
    ).toEqual({ list: 288, review: 384 })
  })

  it('keeps map at 280 and proportionally shrinks extras when the window is ~856', () => {
    const displayed = clampPreferredWidths({
      available: 856,
      list: LIST_DEFAULT,
      review: REVIEW_DEFAULT,
      hasReview: true,
    })

    expect(displayed).toEqual({ list: 247, review: 329 })
    expect(displayed.list + displayed.review + MAP_MIN).toBe(856)
    expect(displayed.list).toBeGreaterThanOrEqual(LIST_MIN)
    expect(displayed.review).toBeGreaterThanOrEqual(REVIEW_MIN)
  })

  it('does not write below pane mins when there is no leftover extra', () => {
    expect(
      clampPreferredWidths({
        available: LIST_MIN + REVIEW_MIN + MAP_MIN,
        list: LIST_DEFAULT,
        review: REVIEW_DEFAULT,
        hasReview: true,
      }),
    ).toEqual({ list: LIST_MIN, review: REVIEW_MIN })
  })

  it('leaves review unused in two-pane layout; main is the slack', () => {
    const displayed = clampPreferredWidths({
      available: 1000,
      list: LIST_DEFAULT,
      review: 512,
      hasReview: false,
    })

    expect(displayed.list).toBe(LIST_DEFAULT)
    expect(displayed.review).toBe(512)
    expect(1000 - displayed.list).toBeGreaterThanOrEqual(320)
  })

  it('shrinks only the list toward min when two-pane main would drop below ~320', () => {
    const displayed = clampPreferredWidths({
      available: 600,
      list: LIST_DEFAULT,
      review: 512,
      hasReview: false,
    })

    expect(displayed.list).toBe(280)
    expect(displayed.review).toBe(512)
    expect(600 - displayed.list).toBe(320)
  })
})

describe('resizeSidePane two-pane', () => {
  it('grows list against main slack and ignores stored review', () => {
    const list = resizeSidePane({
      side: 'list',
      delta: 50,
      available: 1000,
      list: LIST_DEFAULT,
      review: 512,
      hasReview: false,
    })

    expect(list).toBe(338)
    expect(
      resizeSidePane({
        side: 'review',
        delta: 80,
        available: 1000,
        list: LIST_DEFAULT,
        review: 512,
        hasReview: false,
      }),
    ).toBe(512)
  })
})
