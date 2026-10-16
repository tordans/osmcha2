import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  getChangesetNotesActions,
  resetChangesetNotesStoreForTests,
} from '../../stores/changeset-notes-store.ts'
import { FinishReviewCard } from './FinishReviewCard.tsx'

function renderCard(changesetId: number) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <FinishReviewCard changesetId={changesetId} selectRef={() => {}} />
    </QueryClientProvider>,
  )
}

describe('FinishReviewCard focus request', () => {
  // jsdom has no scrollIntoView; stub it for these tests only.
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    resetChangesetNotesStoreForTests()
    scrollIntoView.mockClear()
    Element.prototype.scrollIntoView = scrollIntoView
  })

  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  })

  test('scrolls once per request, and not again when the card mounts later', () => {
    const first = renderCard(1)
    expect(scrollIntoView).not.toHaveBeenCalled()

    act(() => getChangesetNotesActions().requestFinishFocus(1))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    first.unmount()
    renderCard(1)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  test('a request made before the card mounts scrolls it into view on mount', () => {
    getChangesetNotesActions().requestFinishFocus(1)
    renderCard(1)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  test('ignores a request for another changeset', () => {
    getChangesetNotesActions().requestFinishFocus(2)
    renderCard(1)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
