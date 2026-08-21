import { describe, expect, it } from 'vitest'
import { defaultListPaneOpen, effectiveListPaneOpen } from './list-pane-store.ts'

describe('defaultListPaneOpen', () => {
  it('opens on the list home and other chrome pages', () => {
    expect(defaultListPaneOpen('/')).toBe(true)
    expect(defaultListPaneOpen('/filters')).toBe(true)
    expect(defaultListPaneOpen('/about')).toBe(true)
  })

  it('collapses on a changeset URL, including when filters are in the search', () => {
    expect(defaultListPaneOpen('/changesets/123')).toBe(false)
    expect(defaultListPaneOpen('/changesets/123456')).toBe(false)
  })
})

describe('effectiveListPaneOpen', () => {
  it('stays open off a changeset even if the session stored collapsed', () => {
    expect(effectiveListPaneOpen('/', false)).toBe(true)
    expect(effectiveListPaneOpen('/filters', false)).toBe(true)
  })

  it('honors the session toggle on a changeset page', () => {
    expect(effectiveListPaneOpen('/changesets/123', false)).toBe(false)
    expect(effectiveListPaneOpen('/changesets/123', true)).toBe(true)
  })
})
