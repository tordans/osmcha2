import { describe, expect, test } from 'vitest'
import {
  exclusiveSiblingsOf,
  hasResolvedTag,
  INTENTIONAL_TAG_ID,
  RESOLVED_TAG_ID,
  reviewPresentation,
  SEVERITY_HIGH_TAG_ID,
  SEVERITY_LOW_TAG_ID,
  UNINTENTIONAL_TAG_ID,
} from './reviewPresentation.ts'

describe('hasResolvedTag', () => {
  test('is true when tag id 9 is present', () => {
    expect(hasResolvedTag([{ id: 9, name: 'Resolved' }])).toBe(true)
  })

  test('is false when resolved is missing', () => {
    expect(hasResolvedTag([{ id: 1, name: 'intentional' }])).toBe(false)
    expect(hasResolvedTag()).toBe(false)
  })
})

describe('exclusiveSiblingsOf', () => {
  test('returns the other intent tag', () => {
    expect(exclusiveSiblingsOf(INTENTIONAL_TAG_ID)).toEqual([UNINTENTIONAL_TAG_ID])
    expect(exclusiveSiblingsOf(UNINTENTIONAL_TAG_ID)).toEqual([INTENTIONAL_TAG_ID])
  })

  test('returns empty for DWG', () => {
    expect(exclusiveSiblingsOf(11)).toEqual([])
  })
})

describe('reviewPresentation', () => {
  test('returns null when not checked', () => {
    expect(reviewPresentation({ checked: false, harmful: false })).toBeNull()
  })

  test('Looks OK is CircleCheck green even with leftover tags', () => {
    const result = reviewPresentation({
      checked: true,
      harmful: false,
      tags: [{ id: SEVERITY_LOW_TAG_ID, name: 'Severity: Low' }],
      checkUser: 'Alice',
    })
    expect(result).toMatchObject({
      icon: 'circleCheck',
      color: 'green',
      name: 'Looks OK',
    })
    expect(result?.tooltip).toContain('Leftover tags: Severity: Low')
  })

  test('Needs a look with no tags is Flag orange', () => {
    expect(
      reviewPresentation({ checked: true, harmful: true, tags: [], checkUser: 'Bob' }),
    ).toMatchObject({
      icon: 'flag',
      color: 'orange',
      name: 'Needs a look',
    })
  })

  test('Resolved upgrades to CircleCheck green', () => {
    expect(
      reviewPresentation({
        checked: true,
        harmful: true,
        tags: [{ id: RESOLVED_TAG_ID, name: 'Resolved' }],
      }),
    ).toMatchObject({ icon: 'circleCheck', color: 'green', name: 'Resolved' })
  })

  test('High severity escalates to MessageCircleWarning', () => {
    expect(
      reviewPresentation({
        checked: true,
        harmful: true,
        tags: [{ id: SEVERITY_HIGH_TAG_ID, name: 'Severity: High' }],
      }),
    ).toMatchObject({ icon: 'messageWarning', color: 'orange' })
  })

  test('Low severity stays Flag', () => {
    expect(
      reviewPresentation({
        checked: true,
        harmful: true,
        tags: [{ id: SEVERITY_LOW_TAG_ID, name: 'Severity: Low' }],
      }),
    ).toMatchObject({ icon: 'flag', color: 'orange' })
  })
})
