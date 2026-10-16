import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LIST_DEFAULT, LIST_MAX, LIST_MIN, REVIEW_MIN } from '../layout/paneWidths.ts'
import { getListWidth, getPaneLayoutActions, getReviewWidth } from './pane-layout-store.ts'

beforeEach(() => {
  const actions = getPaneLayoutActions()
  actions.resetListWidth()
  actions.resetReviewWidth()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pane layout store', () => {
  it('does not rewrite localStorage while a drag holds a clamp limit', () => {
    const actions = getPaneLayoutActions()
    actions.setListWidth(LIST_MAX)
    actions.setReviewWidth(REVIEW_MIN)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    actions.setListWidth(LIST_MAX + 1)
    actions.setListWidth(LIST_MAX + 50)
    actions.setReviewWidth(REVIEW_MIN - 1)

    expect(setItem).not.toHaveBeenCalled()
    expect(getListWidth()).toBe(LIST_MAX)
    expect(getReviewWidth()).toBe(REVIEW_MIN)
  })

  it('does not rewrite localStorage when a reset targets the value already set', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    getPaneLayoutActions().resetListWidth()
    getPaneLayoutActions().resetReviewWidth()

    expect(setItem).not.toHaveBeenCalled()
    expect(getListWidth()).toBe(LIST_DEFAULT)
  })

  it('still writes localStorage when a width changes', () => {
    const actions = getPaneLayoutActions()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    actions.setListWidth(LIST_MIN)
    expect(setItem).toHaveBeenCalledTimes(1)
    expect(getListWidth()).toBe(LIST_MIN)

    actions.resetListWidth()
    expect(setItem).toHaveBeenCalledTimes(2)
    expect(getListWidth()).toBe(LIST_DEFAULT)
  })
})
