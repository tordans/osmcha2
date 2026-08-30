import { z } from 'zod'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import {
  changesetIdKey,
  emptyUserNotes,
  evictUserNotes,
  objectKeyFromRef,
  type ChangesetDraft,
  type DraftNote,
  type UserNotesState,
} from '../notes/reviewSeen.ts'
import type { PinParam } from '../routing/pinParam.ts'
import type { RefParam } from '../routing/refParam.ts'

export const ANONYMOUS_NOTES_USER = 'anonymous'

export type OpenEditor = { changesetId: number; noteId: string }
export type PinPlacement = { changesetId: number; noteId: string; userKey: string }

const refSchema = z.object({
  type: z.enum(['node', 'way', 'relation']),
  id: z.number(),
  key: z.string().optional(),
})

const pinSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

const draftNoteSchema = z.object({
  id: z.string(),
  body: z.string(),
  ref: refSchema.optional(),
  pin: pinSchema.optional(),
})

const changesetDraftSchema = z.object({
  intro: z.string(),
  notes: z.array(draftNoteSchema),
  updatedAt: z.number(),
})

const userNotesSchema = z.object({
  drafts: z.record(z.string(), changesetDraftSchema),
  seen: z.record(z.string(), z.record(z.string(), z.string())),
  seenTouchedAt: z.record(z.string(), z.number()),
})

const persistedNotesSchema = z.object({
  byUser: z.record(z.string(), userNotesSchema),
})

function memoryStorage(): StateStorage {
  const mem = new Map<string, string>()
  return {
    getItem: (name) => mem.get(name) ?? null,
    setItem: (name, value) => {
      mem.set(name, value)
    },
    removeItem: (name) => {
      mem.delete(name)
    },
  }
}

const fallbackStorage = memoryStorage()

function persistStorage(): StateStorage {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem('osmcha2-changeset-notes-probe', '1')
      localStorage.removeItem('osmcha2-changeset-notes-probe')
      return localStorage
    }
  } catch {
    // Vitest / private mode
  }
  return fallbackStorage
}

function userOf(byUser: Record<string, UserNotesState>, userKey: string): UserNotesState {
  return byUser[userKey] ?? emptyUserNotes()
}

function emptyDraft(): ChangesetDraft {
  return { intro: '', notes: [], updatedAt: Date.now() }
}

function draftOf(user: UserNotesState, changesetId: number): ChangesetDraft {
  return user.drafts[changesetIdKey(changesetId)] ?? emptyDraft()
}

function writeUser(
  byUser: Record<string, UserNotesState>,
  userKey: string,
  next: UserNotesState,
): Record<string, UserNotesState> {
  return { ...byUser, [userKey]: evictUserNotes(next) }
}

function writeDraft(
  user: UserNotesState,
  changesetId: number,
  draft: ChangesetDraft,
): UserNotesState {
  return {
    ...user,
    drafts: {
      ...user.drafts,
      [changesetIdKey(changesetId)]: { ...draft, updatedAt: Date.now() },
    },
  }
}

function writeSeen(
  user: UserNotesState,
  changesetId: number,
  seenMap: Record<string, string>,
): UserNotesState {
  const id = changesetIdKey(changesetId)
  return {
    ...user,
    seen: { ...user.seen, [id]: seenMap },
    seenTouchedAt: { ...user.seenTouchedAt, [id]: Date.now() },
  }
}

function newNoteId() {
  return crypto.randomUUID()
}

function noteMatchesRef(note: DraftNote, ref: RefParam) {
  return note.ref?.type === ref.type && note.ref.id === ref.id && note.ref.key === ref.key
}

function draftNoteIsBlank(note: DraftNote) {
  return !note.body.trim() && !note.pin
}

interface ChangesetNotesStore {
  discussionRaw: boolean
  byUser: Record<string, UserNotesState>
  openEditor: OpenEditor | null
  pinPlacement: PinPlacement | null
  finishFocusNonce: number
  focusedObject: { changesetId: number; type: string; id: number } | null
  actions: {
    setDiscussionRaw: (value: boolean) => void
    markSeen: (userKey: string, changesetId: number, objectKey: string) => void
    markUnseen: (userKey: string, changesetId: number, objectKey: string) => void
    markAllSeen: (userKey: string, changesetId: number, objectKeys: string[]) => void
    setIntro: (userKey: string, changesetId: number, intro: string) => void
    upsertDraftNote: (userKey: string, changesetId: number, note: DraftNote) => void
    removeDraftNote: (userKey: string, changesetId: number, noteId: string) => void
    openOrCreateEditor: (userKey: string, changesetId: number, ref: RefParam) => void
    toggleEditor: (userKey: string, changesetId: number, ref: RefParam) => void
    setOpenEditor: (open: OpenEditor | null) => void
    setPinPlacement: (placement: PinPlacement | null) => void
    placePin: (pin: PinParam) => void
    setDraftPin: (userKey: string, changesetId: number, noteId: string, pin: PinParam) => void
    clearPin: (userKey: string, changesetId: number, noteId: string) => void
    clearDraft: (userKey: string, changesetId: number) => void
    requestFinishFocus: () => void
    setFocusedObject: (focused: { changesetId: number; type: string; id: number } | null) => void
  }
}

const useChangesetNotesStore = create<ChangesetNotesStore>()(
  persist(
    (set) => ({
      discussionRaw: false,
      byUser: {},
      openEditor: null,
      pinPlacement: null,
      finishFocusNonce: 0,
      focusedObject: null,
      actions: {
        setDiscussionRaw: (value) =>
          set((state) => (state.discussionRaw === value ? state : { discussionRaw: value })),
        markSeen: (userKey, changesetId, objectKey) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const id = changesetIdKey(changesetId)
            const seenMap = { ...user.seen[id] }
            seenMap[objectKey] = new Date().toISOString()
            return {
              byUser: writeUser(state.byUser, userKey, writeSeen(user, changesetId, seenMap)),
            }
          }),
        markUnseen: (userKey, changesetId, objectKey) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const id = changesetIdKey(changesetId)
            const seenMap = { ...user.seen[id] }
            if (seenMap[objectKey] == null) return state
            delete seenMap[objectKey]
            return {
              byUser: writeUser(state.byUser, userKey, writeSeen(user, changesetId, seenMap)),
            }
          }),
        markAllSeen: (userKey, changesetId, objectKeys) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const id = changesetIdKey(changesetId)
            const seenMap = { ...user.seen[id] }
            const seenAt = new Date().toISOString()
            for (const objectKey of objectKeys) seenMap[objectKey] = seenAt
            return {
              byUser: writeUser(state.byUser, userKey, writeSeen(user, changesetId, seenMap)),
            }
          }),
        setIntro: (userKey, changesetId, intro) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            return {
              byUser: writeUser(
                state.byUser,
                userKey,
                writeDraft(user, changesetId, { ...draft, intro }),
              ),
            }
          }),
        upsertDraftNote: (userKey, changesetId, note) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const index = draft.notes.findIndex((item) => item.id === note.id)
            const notes =
              index === -1
                ? [...draft.notes, note]
                : draft.notes.map((item, itemIndex) => (itemIndex === index ? note : item))
            let nextUser = writeDraft(user, changesetId, { ...draft, notes })
            if (note.body.trim() && note.ref) {
              const id = changesetIdKey(changesetId)
              const seenMap = { ...nextUser.seen[id] }
              seenMap[objectKeyFromRef(note.ref)] = new Date().toISOString()
              nextUser = writeSeen(nextUser, changesetId, seenMap)
            }
            return { byUser: writeUser(state.byUser, userKey, nextUser) }
          }),
        removeDraftNote: (userKey, changesetId, noteId) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const notes = draft.notes.filter((item) => item.id !== noteId)
            const openEditor =
              state.openEditor?.noteId === noteId && state.openEditor.changesetId === changesetId
                ? null
                : state.openEditor
            const pinPlacement =
              state.pinPlacement?.noteId === noteId &&
              state.pinPlacement.changesetId === changesetId
                ? null
                : state.pinPlacement
            return {
              openEditor,
              pinPlacement,
              byUser: writeUser(
                state.byUser,
                userKey,
                writeDraft(user, changesetId, { ...draft, notes }),
              ),
            }
          }),
        openOrCreateEditor: (userKey, changesetId, ref) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const existing = draft.notes.find((note) => noteMatchesRef(note, ref))
            if (existing) {
              return { openEditor: { changesetId, noteId: existing.id }, pinPlacement: null }
            }
            const note: DraftNote = { id: newNoteId(), body: '', ref }
            return {
              openEditor: { changesetId, noteId: note.id },
              pinPlacement: null,
              byUser: writeUser(
                state.byUser,
                userKey,
                writeDraft(user, changesetId, { ...draft, notes: [...draft.notes, note] }),
              ),
            }
          }),
        toggleEditor: (userKey, changesetId, ref) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const existing = draft.notes.find((note) => noteMatchesRef(note, ref))
            const isOpen =
              existing != null &&
              state.openEditor?.changesetId === changesetId &&
              state.openEditor.noteId === existing.id
            if (isOpen && existing) {
              if (!draftNoteIsBlank(existing)) {
                return { openEditor: null, pinPlacement: null }
              }
              const notes = draft.notes.filter((item) => item.id !== existing.id)
              return {
                openEditor: null,
                pinPlacement: null,
                byUser: writeUser(
                  state.byUser,
                  userKey,
                  writeDraft(user, changesetId, { ...draft, notes }),
                ),
              }
            }
            if (existing) {
              return { openEditor: { changesetId, noteId: existing.id }, pinPlacement: null }
            }
            const note: DraftNote = { id: newNoteId(), body: '', ref }
            return {
              openEditor: { changesetId, noteId: note.id },
              pinPlacement: null,
              byUser: writeUser(
                state.byUser,
                userKey,
                writeDraft(user, changesetId, { ...draft, notes: [...draft.notes, note] }),
              ),
            }
          }),
        setOpenEditor: (open) =>
          set((state) => ({
            openEditor: open,
            pinPlacement: open ? state.pinPlacement : null,
          })),
        setPinPlacement: (placement) => set({ pinPlacement: placement }),
        placePin: (pin) =>
          set((state) => {
            const placement = state.pinPlacement
            if (!placement) return state
            const user = userOf(state.byUser, placement.userKey)
            const draft = draftOf(user, placement.changesetId)
            const notes = draft.notes.map((note) =>
              note.id === placement.noteId ? { ...note, pin } : note,
            )
            return {
              pinPlacement: null,
              byUser: writeUser(
                state.byUser,
                placement.userKey,
                writeDraft(user, placement.changesetId, { ...draft, notes }),
              ),
            }
          }),
        setDraftPin: (userKey, changesetId, noteId, pin) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const notes = draft.notes.map((note) => (note.id === noteId ? { ...note, pin } : note))
            return {
              byUser: writeUser(
                state.byUser,
                userKey,
                writeDraft(user, changesetId, { ...draft, notes }),
              ),
            }
          }),
        clearPin: (userKey, changesetId, noteId) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const notes = draft.notes.map((note) => {
              if (note.id !== noteId) return note
              const { pin: _pin, ...rest } = note
              return rest
            })
            return {
              byUser: writeUser(
                state.byUser,
                userKey,
                writeDraft(user, changesetId, { ...draft, notes }),
              ),
            }
          }),
        clearDraft: (userKey, changesetId) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const drafts = { ...user.drafts }
            delete drafts[changesetIdKey(changesetId)]
            const openEditor =
              state.openEditor?.changesetId === changesetId ? null : state.openEditor
            const pinPlacement =
              state.pinPlacement?.changesetId === changesetId ? null : state.pinPlacement
            return {
              openEditor,
              pinPlacement,
              byUser: writeUser(state.byUser, userKey, { ...user, drafts }),
            }
          }),
        requestFinishFocus: () =>
          set((state) => ({ finishFocusNonce: state.finishFocusNonce + 1 })),
        setFocusedObject: (focused) => set({ focusedObject: focused }),
      },
    }),
    {
      name: 'osmcha2-changeset-notes',
      storage: createJSONStorage(() => persistStorage()),
      partialize: (state) => ({ byUser: state.byUser }),
      merge: (persistedState, currentState) => {
        const parsed = persistedNotesSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        const byUser: Record<string, UserNotesState> = {}
        for (const [userKey, user] of Object.entries(parsed.data.byUser)) {
          byUser[userKey] = evictUserNotes(user)
        }
        return { ...currentState, byUser }
      },
    },
  ),
)

export const useDiscussionRaw = () => useChangesetNotesStore((state) => state.discussionRaw)

export const useChangesetNotesActions = () => useChangesetNotesStore((state) => state.actions)

export const useChangesetDraft = (userKey: string, changesetId: number) =>
  useChangesetNotesStore(
    (state) => userOf(state.byUser, userKey).drafts[changesetIdKey(changesetId)],
  )

export const useSeenMap = (userKey: string, changesetId: number) =>
  useChangesetNotesStore((state) => userOf(state.byUser, userKey).seen[changesetIdKey(changesetId)])

export const useOpenEditor = () => useChangesetNotesStore((state) => state.openEditor)

export const usePinPlacement = () => useChangesetNotesStore((state) => state.pinPlacement)

export const useFinishFocusNonce = () => useChangesetNotesStore((state) => state.finishFocusNonce)

export const useFocusedObject = () => useChangesetNotesStore((state) => state.focusedObject)

export function getPinPlacement() {
  return useChangesetNotesStore.getState().pinPlacement
}

export function getChangesetNotesActions() {
  return useChangesetNotesStore.getState().actions
}

export function getOpenEditor() {
  return useChangesetNotesStore.getState().openEditor
}

export function getChangesetDraft(userKey: string, changesetId: number) {
  return userOf(useChangesetNotesStore.getState().byUser, userKey).drafts[
    changesetIdKey(changesetId)
  ]
}

export function resetChangesetNotesStoreForTests() {
  useChangesetNotesStore.setState({
    discussionRaw: false,
    byUser: {},
    openEditor: null,
    pinPlacement: null,
    finishFocusNonce: 0,
    focusedObject: null,
  })
}

export function draftHasUnsentNotes(draft: ChangesetDraft | undefined) {
  if (!draft) return false
  if (draft.intro.trim()) return true
  return draft.notes.some((note) => note.body.trim())
}

export function postableDraftNotes(draft: ChangesetDraft | undefined): DraftNote[] {
  if (!draft) return []
  return draft.notes.filter((note) => note.body.trim() && (note.ref || note.pin))
}
