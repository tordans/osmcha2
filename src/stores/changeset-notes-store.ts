import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { objectRefKey } from '../notes/locateNotes.ts'
import {
  changesetIdKey,
  draftsForObject,
  emptyUserNotes,
  evictUserNotes,
  objectKeyFromRef,
  type ChangesetDraft,
  type DraftNote,
  type UserNotesState,
} from '../notes/reviewSeen.ts'
import type { PinParam } from '../routing/pinParam.ts'
import type { RefParam } from '../routing/refParam.ts'
import { safeJSONStorage, syncAcrossTabs } from './persistStorage.ts'

export const ANONYMOUS_NOTES_USER = 'anonymous'

type OpenEditor = { changesetId: number; noteId: string }
type PinPlacement = { changesetId: number; noteId: string; userKey: string }

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
  // Added later: drafts saved before it have none and stay object or tag notes.
  group: z.number().int().min(2).optional(),
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
  // Added later: notes saved before it have none.
  unseenOverrides: z.record(z.string(), z.array(z.string())).default({}),
  seenTouchedAt: z.record(z.string(), z.number()),
})

const persistedNotesSchema = z.object({
  byUser: z.record(z.string(), z.unknown()),
})

/** Keeps what is valid of a record whose values fail one by one. */
function validEntries<T>(value: unknown, schema: z.ZodType<T>): Record<string, T> {
  if (typeof value !== 'object' || value === null) return {}
  const valid: Record<string, T> = {}
  for (const [key, entry] of Object.entries(value)) {
    const parsed = schema.safeParse(entry)
    if (parsed.success) valid[key] = parsed.data
  }
  return valid
}

/**
 * One user's stored notes. A value that no longer fits the schema drops only that changeset's
 * entry, not every draft and seen mark of every user.
 */
function parseUserNotes(value: unknown): UserNotesState {
  const parsed = userNotesSchema.safeParse(value)
  if (parsed.success) return parsed.data
  const user = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  return {
    drafts: validEntries(user.drafts, changesetDraftSchema),
    seen: validEntries(user.seen, z.record(z.string(), z.string())),
    unseenOverrides: validEntries(user.unseenOverrides, z.array(z.string())),
    seenTouchedAt: validEntries(user.seenTouchedAt, z.number()),
  }
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

/**
 * Writes the seen map. `unseenOverrides` is the whole new list when given: marking an object seen
 * drops its override, un-seeing one adds it (see `effectiveSeenAt`).
 */
function writeSeen(
  user: UserNotesState,
  changesetId: number,
  seenMap: Record<string, string>,
  unseenOverrides?: string[],
): UserNotesState {
  const id = changesetIdKey(changesetId)
  return {
    ...user,
    seen: { ...user.seen, [id]: seenMap },
    unseenOverrides:
      unseenOverrides == null
        ? user.unseenOverrides
        : { ...user.unseenOverrides, [id]: unseenOverrides },
    seenTouchedAt: { ...user.seenTouchedAt, [id]: Date.now() },
  }
}

function withoutOverrides(user: UserNotesState, changesetId: number, objectKeys: string[]) {
  const current = user.unseenOverrides[changesetIdKey(changesetId)] ?? []
  return current.filter((key) => !objectKeys.includes(key))
}

function newNoteId() {
  return crypto.randomUUID()
}

/**
 * A group note and a plain note on the same tag are different drafts. The group's size is not
 * compared: a draft for the group stays that group's draft when the group grows or shrinks.
 */
function noteMatchesRef(note: DraftNote, ref: RefParam, group?: number) {
  return (
    note.ref?.type === ref.type &&
    note.ref.id === ref.id &&
    note.ref.key === ref.key &&
    (note.group != null) === (group != null)
  )
}

function newDraftNote(ref: RefParam, group?: number): DraftNote {
  return { id: newNoteId(), body: '', ref, ...(group ? { group } : {}) }
}

function draftNoteIsBlank(note: DraftNote) {
  return !note.body.trim() && !note.pin
}

/** One object's seen state before an undoable step: its seen time and its un-seen override. */
type SeenBefore = { objectKey: string; seenAt: string | undefined; override: boolean }

/** A step the reviewer can take back with the Undo button or Cmd/Ctrl+Z. Lives in memory only. */
export type UndoEntry = { userKey: string; changesetId: number; label: string } & (
  | { kind: 'seen'; before: SeenBefore[] }
  | { kind: 'note'; note: DraftNote; index: number }
)

const UNDO_LIMIT = 50

function seenBefore(user: UserNotesState, changesetId: number, objectKeys: readonly string[]) {
  const id = changesetIdKey(changesetId)
  const overrides = user.unseenOverrides[id] ?? []
  return [...new Set(objectKeys)].map((objectKey): SeenBefore => ({
    objectKey,
    seenAt: user.seen[id]?.[objectKey],
    override: overrides.includes(objectKey),
  }))
}

function seenLabel(objectKeys: readonly string[], seen: boolean) {
  const what = objectKeys.length === 1 ? objectKeys[0] : `${objectKeys.length} objects`
  return `Mark ${what} as ${seen ? 'seen' : 'not seen'}`
}

/**
 * Adds an undo step for a change of seen marks, unless the marks did not change: marking a seen
 * object seen again is nothing to take back.
 */
function pushSeenUndo(
  undoStack: UndoEntry[],
  userKey: string,
  changesetId: number,
  before: SeenBefore[],
  after: UserNotesState,
  seen: boolean,
): UndoEntry[] {
  const changed = before.filter((item) => {
    const [now] = seenBefore(after, changesetId, [item.objectKey])
    return (now?.seenAt != null) !== (item.seenAt != null) || now?.override !== item.override
  })
  if (changed.length === 0) return undoStack
  const label = seenLabel(
    changed.map((item) => item.objectKey),
    seen,
  )
  const entry: UndoEntry = { kind: 'seen', userKey, changesetId, label, before: changed }
  return [...undoStack, entry].slice(-UNDO_LIMIT)
}

function restoreSeen(user: UserNotesState, changesetId: number, before: SeenBefore[]) {
  const id = changesetIdKey(changesetId)
  const seenMap = { ...user.seen[id] }
  for (const { objectKey, seenAt } of before) {
    if (seenAt == null) delete seenMap[objectKey]
    else seenMap[objectKey] = seenAt
  }
  const keys = before.map((item) => item.objectKey)
  const overrides = [
    ...withoutOverrides(user, changesetId, keys),
    ...before.filter((item) => item.override).map((item) => item.objectKey),
  ]
  return writeSeen(user, changesetId, seenMap, overrides)
}

interface ChangesetNotesStore {
  byUser: Record<string, UserNotesState>
  undoStack: UndoEntry[]
  openEditor: OpenEditor | null
  pinPlacement: PinPlacement | null
  actions: {
    markSeen: (userKey: string, changesetId: number, objectKey: string) => void
    markUnseen: (userKey: string, changesetId: number, objectKey: string) => void
    markAllSeen: (userKey: string, changesetId: number, objectKeys: string[]) => void
    markAllUnseen: (userKey: string, changesetId: number, objectKeys: string[]) => void
    setIntro: (userKey: string, changesetId: number, intro: string) => void
    upsertDraftNote: (
      userKey: string,
      changesetId: number,
      note: DraftNote,
      /** The objects a group note is about, all seen with it. Default: the note's own object. */
      groupObjectKeys?: readonly string[],
    ) => void
    removeDraftNote: (userKey: string, changesetId: number, noteId: string) => void
    openOrCreateEditor: (
      userKey: string,
      changesetId: number,
      ref: RefParam,
      group?: number,
    ) => void
    toggleEditor: (userKey: string, changesetId: number, ref: RefParam, group?: number) => void
    setOpenEditor: (open: OpenEditor | null) => void
    setPinPlacement: (placement: PinPlacement | null) => void
    placePin: (pin: PinParam) => void
    setDraftPin: (userKey: string, changesetId: number, noteId: string, pin: PinParam) => void
    clearPin: (userKey: string, changesetId: number, noteId: string) => void
    clearDraft: (userKey: string, changesetId: number) => void
    /** Takes back the last undoable step on this changeset; returns it, or null when none. */
    undo: (userKey: string, changesetId: number) => UndoEntry | null
  }
}

const useChangesetNotesStore = create<ChangesetNotesStore>()(
  persist(
    (set, get) => ({
      byUser: {},
      undoStack: [],
      openEditor: null,
      pinPlacement: null,
      actions: {
        markSeen: (userKey, changesetId, objectKey) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const id = changesetIdKey(changesetId)
            const seenMap = { ...user.seen[id] }
            seenMap[objectKey] = new Date().toISOString()
            const next = writeSeen(
              user,
              changesetId,
              seenMap,
              withoutOverrides(user, changesetId, [objectKey]),
            )
            return {
              byUser: writeUser(state.byUser, userKey, next),
              undoStack: pushSeenUndo(
                state.undoStack,
                userKey,
                changesetId,
                seenBefore(user, changesetId, [objectKey]),
                next,
                true,
              ),
            }
          }),
        markUnseen: (userKey, changesetId, objectKey) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const id = changesetIdKey(changesetId)
            const seenMap = { ...user.seen[id] }
            const overrides = user.unseenOverrides[id] ?? []
            // The override keeps an automatically seen object (a minor move) un-seen. For any
            // other object it does nothing.
            if (seenMap[objectKey] == null && overrides.includes(objectKey)) return state
            delete seenMap[objectKey]
            const next = writeSeen(user, changesetId, seenMap, [
              ...withoutOverrides(user, changesetId, [objectKey]),
              objectKey,
            ])
            return {
              byUser: writeUser(state.byUser, userKey, next),
              undoStack: pushSeenUndo(
                state.undoStack,
                userKey,
                changesetId,
                seenBefore(user, changesetId, [objectKey]),
                next,
                false,
              ),
            }
          }),
        markAllSeen: (userKey, changesetId, objectKeys) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const id = changesetIdKey(changesetId)
            const seenMap = { ...user.seen[id] }
            const seenAt = new Date().toISOString()
            for (const objectKey of objectKeys) seenMap[objectKey] = seenAt
            const next = writeSeen(
              user,
              changesetId,
              seenMap,
              withoutOverrides(user, changesetId, objectKeys),
            )
            return {
              byUser: writeUser(state.byUser, userKey, next),
              undoStack: pushSeenUndo(
                state.undoStack,
                userKey,
                changesetId,
                seenBefore(user, changesetId, objectKeys),
                next,
                true,
              ),
            }
          }),
        markAllUnseen: (userKey, changesetId, objectKeys) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const id = changesetIdKey(changesetId)
            const seenMap = { ...user.seen[id] }
            for (const objectKey of objectKeys) delete seenMap[objectKey]
            const next = writeSeen(user, changesetId, seenMap, [
              ...withoutOverrides(user, changesetId, objectKeys),
              ...objectKeys,
            ])
            return {
              byUser: writeUser(state.byUser, userKey, next),
              undoStack: pushSeenUndo(
                state.undoStack,
                userKey,
                changesetId,
                seenBefore(user, changesetId, objectKeys),
                next,
                false,
              ),
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
        upsertDraftNote: (userKey, changesetId, note, groupObjectKeys) =>
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
              const objectKeys = groupObjectKeys ?? [objectKeyFromRef(note.ref)]
              const seenAt = new Date().toISOString()
              for (const objectKey of objectKeys) seenMap[objectKey] = seenAt
              nextUser = writeSeen(
                nextUser,
                changesetId,
                seenMap,
                withoutOverrides(nextUser, changesetId, [...objectKeys]),
              )
            }
            return { byUser: writeUser(state.byUser, userKey, nextUser) }
          }),
        removeDraftNote: (userKey, changesetId, noteId) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const index = draft.notes.findIndex((item) => item.id === noteId)
            const removed = draft.notes[index]
            const notes = draft.notes.filter((item) => item.id !== noteId)
            // An empty note is nothing to take back.
            const undoStack =
              removed && !draftNoteIsBlank(removed)
                ? [
                    ...state.undoStack,
                    {
                      kind: 'note' as const,
                      userKey,
                      changesetId,
                      label: 'Delete a note',
                      note: removed,
                      index,
                    },
                  ].slice(-UNDO_LIMIT)
                : state.undoStack
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
              undoStack,
              byUser: writeUser(
                state.byUser,
                userKey,
                writeDraft(user, changesetId, { ...draft, notes }),
              ),
            }
          }),
        openOrCreateEditor: (userKey, changesetId, ref, group) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const existing = draft.notes.find((note) => noteMatchesRef(note, ref, group))
            if (existing) {
              return { openEditor: { changesetId, noteId: existing.id }, pinPlacement: null }
            }
            const note = newDraftNote(ref, group)
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
        toggleEditor: (userKey, changesetId, ref, group) =>
          set((state) => {
            const user = userOf(state.byUser, userKey)
            const draft = draftOf(user, changesetId)
            const existing = draft.notes.find((note) => noteMatchesRef(note, ref, group))
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
            const note = newDraftNote(ref, group)
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
              // The notes went out (or were thrown away): bringing one back would post it twice.
              undoStack: state.undoStack.filter(
                (entry) =>
                  !(
                    entry.kind === 'note' &&
                    entry.userKey === userKey &&
                    entry.changesetId === changesetId
                  ),
              ),
            }
          }),
        undo: (userKey, changesetId) => {
          const state = get()
          const at = state.undoStack.findLastIndex(
            (entry) => entry.userKey === userKey && entry.changesetId === changesetId,
          )
          const entry = state.undoStack[at]
          if (!entry) return null
          const user = userOf(state.byUser, userKey)
          let next: UserNotesState
          if (entry.kind === 'seen') {
            next = restoreSeen(user, changesetId, entry.before)
          } else {
            const draft = draftOf(user, changesetId)
            const notes = draft.notes.some((note) => note.id === entry.note.id)
              ? draft.notes
              : draft.notes.toSpliced(Math.min(entry.index, draft.notes.length), 0, entry.note)
            next = writeDraft(user, changesetId, { ...draft, notes })
          }
          set({
            byUser: writeUser(state.byUser, userKey, next),
            undoStack: state.undoStack.toSpliced(at, 1),
          })
          return entry
        },
      },
    }),
    {
      name: 'osmcha2-changeset-notes',
      storage: safeJSONStorage(),
      partialize: (state) => ({ byUser: state.byUser }),
      merge: (persistedState, currentState) => {
        const stored = persistedNotesSchema.safeParse(persistedState)
        if (!stored.success) return currentState
        const byUser: Record<string, UserNotesState> = {}
        for (const [userKey, user] of Object.entries(stored.data.byUser)) {
          byUser[userKey] = evictUserNotes(parseUserNotes(user))
        }
        return { ...currentState, byUser }
      },
    },
  ),
)

syncAcrossTabs(useChangesetNotesStore)

export const useChangesetNotesActions = () => useChangesetNotesStore((state) => state.actions)

export const useChangesetDraft = (userKey: string, changesetId: number) =>
  useChangesetNotesStore(
    (state) => userOf(state.byUser, userKey).drafts[changesetIdKey(changesetId)],
  )

export const useSeenMap = (userKey: string, changesetId: number) =>
  useChangesetNotesStore((state) => userOf(state.byUser, userKey).seen[changesetIdKey(changesetId)])

export const useUnseenOverrides = (userKey: string, changesetId: number) =>
  useChangesetNotesStore(
    (state) => userOf(state.byUser, userKey).unseenOverrides[changesetIdKey(changesetId)],
  )

/*
 * Per-object reads for the rows of the Changes list. Each row re-renders only when its own seen
 * state or its own drafts change, not on every keystroke in a note on another row.
 */

/** When the object was marked seen, or undefined. */
export const useObjectSeenAt = (userKey: string, changesetId: number, objectKey: string) =>
  useChangesetNotesStore(
    (state) => userOf(state.byUser, userKey).seen[changesetIdKey(changesetId)]?.[objectKey],
  )

/** Whether the user marked the object as not seen after all. */
export const useIsUnseenOverride = (userKey: string, changesetId: number, objectKey: string) =>
  useChangesetNotesStore(
    (state) =>
      userOf(state.byUser, userKey).unseenOverrides[changesetIdKey(changesetId)]?.includes(
        objectKey,
      ) ?? false,
  )

/** Draft notes on the object, same array while none of them changes. */
export const useObjectDrafts = (userKey: string, changesetId: number, type: string, id: number) =>
  useChangesetNotesStore(
    useShallow((state) =>
      draftsForObject(userOf(state.byUser, userKey).drafts[changesetIdKey(changesetId)], type, id),
    ),
  )

/** Draft notes on any of the objects (`type/id` keys), same array while none of them changes. */
export const useDraftsForObjects = (
  userKey: string,
  changesetId: number,
  objectKeys: ReadonlySet<string>,
) =>
  useChangesetNotesStore(
    useShallow(
      (state) =>
        userOf(state.byUser, userKey).drafts[changesetIdKey(changesetId)]?.notes.filter(
          (note) => note.ref != null && objectKeys.has(objectRefKey(note.ref.type, note.ref.id)),
        ) ?? EMPTY_DRAFT_NOTES,
    ),
  )

const EMPTY_DRAFT_NOTES: DraftNote[] = []

/** Open note id when it belongs to `changesetId`, else null; re-renders only when that changes. */
export const useOpenEditorNoteId = (changesetId: number) =>
  useChangesetNotesStore((state) =>
    state.openEditor?.changesetId === changesetId ? state.openEditor.noteId : null,
  )

export const usePinPlacement = () => useChangesetNotesStore((state) => state.pinPlacement)

export function getPinPlacement() {
  return useChangesetNotesStore.getState().pinPlacement
}

/** The step Undo would take back on this changeset, or null. */
export const useLastUndo = (userKey: string, changesetId: number) =>
  useChangesetNotesStore(
    (state) =>
      state.undoStack.findLast(
        (entry) => entry.userKey === userKey && entry.changesetId === changesetId,
      ) ?? null,
  )

export function getChangesetNotesActions() {
  return useChangesetNotesStore.getState().actions
}

export function getOpenEditor() {
  return useChangesetNotesStore.getState().openEditor
}

export function getSeenState(userKey: string, changesetId: number) {
  const user = userOf(useChangesetNotesStore.getState().byUser, userKey)
  const id = changesetIdKey(changesetId)
  return { seenMap: user.seen[id], unseenOverrides: user.unseenOverrides[id] }
}

export function getChangesetDraft(userKey: string, changesetId: number) {
  return userOf(useChangesetNotesStore.getState().byUser, userKey).drafts[
    changesetIdKey(changesetId)
  ]
}

export function resetChangesetNotesStoreForTests() {
  useChangesetNotesStore.setState({
    byUser: {},
    undoStack: [],
    openEditor: null,
    pinPlacement: null,
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
