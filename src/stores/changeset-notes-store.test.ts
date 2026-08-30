import { describe, expect, test } from 'vitest'
import {
  draftHasUnsentNotes,
  getChangesetDraft,
  getChangesetNotesActions,
  getOpenEditor,
  postableDraftNotes,
  resetChangesetNotesStoreForTests,
} from './changeset-notes-store.ts'

describe('changeset notes store', () => {
  test('openOrCreateEditor creates one draft per ref and reopen finds it', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    actions.openOrCreateEditor('alice', 1, { type: 'way', id: 10, key: 'building' })
    actions.openOrCreateEditor('alice', 1, { type: 'way', id: 10, key: 'building' })
    const draft = getChangesetDraft('alice', 1)
    expect(draft?.notes).toHaveLength(1)
    expect(draft?.notes[0]?.ref).toEqual({ type: 'way', id: 10, key: 'building' })
    expect(draftHasUnsentNotes(draft)).toBe(false)
  })

  test('saving a non-empty body marks the object seen and is postable', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    actions.openOrCreateEditor('alice', 1, { type: 'way', id: 10 })
    const noteId = getChangesetDraft('alice', 1)?.notes[0]?.id
    expect(noteId).toBeDefined()
    actions.upsertDraftNote('alice', 1, {
      id: noteId!,
      body: 'check this building',
      ref: { type: 'way', id: 10 },
    })
    const draft = getChangesetDraft('alice', 1)
    expect(postableDraftNotes(draft)).toHaveLength(1)
    expect(draftHasUnsentNotes(draft)).toBe(true)
  })

  test('toggleEditor closes an empty note and reopens a saved one', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    const ref = { type: 'way' as const, id: 10 }
    actions.toggleEditor('alice', 1, ref)
    expect(getOpenEditor()?.changesetId).toBe(1)
    expect(getChangesetDraft('alice', 1)?.notes).toHaveLength(1)
    actions.toggleEditor('alice', 1, ref)
    expect(getOpenEditor()).toBeNull()
    expect(getChangesetDraft('alice', 1)?.notes).toHaveLength(0)

    actions.toggleEditor('alice', 1, ref)
    const noteId = getChangesetDraft('alice', 1)?.notes[0]?.id
    expect(noteId).toBeDefined()
    actions.upsertDraftNote('alice', 1, {
      id: noteId!,
      body: 'keep this',
      ref,
    })
    actions.toggleEditor('alice', 1, ref)
    expect(getOpenEditor()).toBeNull()
    expect(getChangesetDraft('alice', 1)?.notes).toHaveLength(1)
    actions.toggleEditor('alice', 1, ref)
    expect(getOpenEditor()?.noteId).toBe(noteId)
  })
})
