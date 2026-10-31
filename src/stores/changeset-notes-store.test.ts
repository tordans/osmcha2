import { describe, expect, test } from 'vitest'
import {
  draftHasUnsentNotes,
  getChangesetDraft,
  getChangesetNotesActions,
  getOpenEditor,
  getSeenState,
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

  test('a group note and a plain note on the same tag are separate drafts', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    const ref = { type: 'node' as const, id: 5, key: 'man_made' }
    actions.openOrCreateEditor('alice', 1, ref, 3)
    // The group grew: still the same draft.
    actions.openOrCreateEditor('alice', 1, ref, 4)
    actions.openOrCreateEditor('alice', 1, ref)
    const notes = getChangesetDraft('alice', 1)?.notes ?? []
    expect(notes).toHaveLength(2)
    expect(notes.map((note) => note.group)).toEqual([3, undefined])
    expect(notes[1]).not.toHaveProperty('group')
  })

  test('toggleEditor on a group note closes it again when it is empty', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    const ref = { type: 'node' as const, id: 5, key: 'man_made' }
    actions.toggleEditor('alice', 1, ref, 2)
    expect(getChangesetDraft('alice', 1)?.notes[0]?.group).toBe(2)
    actions.toggleEditor('alice', 1, ref, 2)
    expect(getOpenEditor()).toBeNull()
    expect(getChangesetDraft('alice', 1)?.notes).toHaveLength(0)
  })

  test('writing a group note marks all objects of the group seen', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    const note = { id: 'n', ref: { type: 'node' as const, id: 5, key: 'man_made' }, group: 2 }
    actions.upsertDraftNote('alice', 1, { ...note, body: 'both' }, ['node/5', 'node/6'])
    const { seenMap } = getSeenState('alice', 1)
    expect(Object.keys(seenMap ?? {}).toSorted()).toEqual(['node/5', 'node/6'])
  })

  test('a group draft is posted with its group size', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    actions.openOrCreateEditor('alice', 1, { type: 'node', id: 5, key: 'man_made' }, 2)
    const note = getChangesetDraft('alice', 1)?.notes[0]
    actions.upsertDraftNote('alice', 1, { ...note!, body: 'both are wrong' })
    expect(postableDraftNotes(getChangesetDraft('alice', 1))[0]?.group).toBe(2)
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

  test('un-seeing stores an override that seeing again removes', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    // A minor move has no stored seen entry; un-seeing it must still be remembered.
    actions.markUnseen('alice', 1, 'node/5')
    expect(getSeenState('alice', 1).seenMap).toEqual({})
    expect(getSeenState('alice', 1).unseenOverrides).toEqual(['node/5'])

    actions.markUnseen('alice', 1, 'node/5')
    expect(getSeenState('alice', 1).unseenOverrides).toEqual(['node/5'])

    actions.markSeen('alice', 1, 'node/5')
    expect(getSeenState('alice', 1).unseenOverrides).toEqual([])
    expect(getSeenState('alice', 1).seenMap?.['node/5']).toBeDefined()

    actions.markUnseen('alice', 1, 'node/5')
    expect(getSeenState('alice', 1).seenMap?.['node/5']).toBeUndefined()
    expect(getSeenState('alice', 1).unseenOverrides).toEqual(['node/5'])
    actions.markAllSeen('alice', 1, ['node/5', 'node/6'])
    expect(getSeenState('alice', 1).unseenOverrides).toEqual([])
  })

  test('markAllUnseen un-sees every object, including automatically seen ones', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    actions.markAllSeen('alice', 1, ['node/5', 'node/6'])
    actions.markAllUnseen('alice', 1, ['node/5', 'node/6'])
    expect(getSeenState('alice', 1).seenMap).toEqual({})
    expect(getSeenState('alice', 1).unseenOverrides).toEqual(['node/5', 'node/6'])
  })

  test('saving a note on an un-seen minor move marks it seen again', () => {
    resetChangesetNotesStoreForTests()
    const actions = getChangesetNotesActions()
    actions.markUnseen('alice', 1, 'node/5')
    actions.upsertDraftNote('alice', 1, {
      id: 'n1',
      body: 'why',
      ref: { type: 'node', id: 5 },
    })
    expect(getSeenState('alice', 1).unseenOverrides).toEqual([])
  })
})
