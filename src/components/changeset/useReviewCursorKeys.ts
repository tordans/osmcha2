import { useHotkeys, type UseHotkeyDefinition } from '@tanstack/react-hotkeys'
import { useRouter } from '@tanstack/react-router'
import { createContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  REVIEW_ADD_NOTE,
  REVIEW_MARK_SEEN,
  REVIEW_MARK_UNSEEN,
  REVIEW_NEXT_STEP,
  REVIEW_PREVIOUS_STEP,
  REVIEW_STEP_INTO,
  REVIEW_STEP_OUT,
  REVIEW_UNDO,
  type HotkeyBinding,
} from '../../config/bindings.ts'
import { objectRefKey } from '../../notes/locateNotes.ts'
import { parseRefParam } from '../../routing/refParam.ts'
import { useChangesetHoverActions } from '../../stores/changeset-hover-store.ts'
import {
  getChangesetNotesActions,
  getOpenEditor,
  useChangesetNotesActions,
  type UndoEntry,
} from '../../stores/changeset-notes-store.ts'
import { getGroupCursorKey } from '../../stores/review-focus-store.ts'
import type { ElementChange } from './changesetElements.ts'
import { refParamFromElement } from './refSelection.ts'
import { groupHeaderTarget } from './scrollChildIntoScroller.ts'
import {
  changeKey,
  nextStep,
  nextUnseen,
  previousStep,
  reviewCursorOf,
  stepInto,
  stepOut,
  type ReviewCursor,
  type TagGroups,
} from './tagGroups.ts'

const INTERACTIVE_SELECTOR = 'a[href], button, summary, [role="button"], [role="tab"]'
/**
 * The library runs at `document`, before Headless UI's Escape listener on `window`, and would take
 * the key from a dialog. These two keys stay untouched until they turn out to be for the review.
 */
const LEAVE_EVENT_ALONE = { preventDefault: false, stopPropagation: false }

/**
 * After a seen button: go where S would go from there, with the next seen button at `anchorY`, so
 * the next click lands on the same spot. Stable, so rows stay memoized.
 */
export const MoveOnAfterSeenContext = createContext<(from: ReviewCursor, anchorY?: number) => void>(
  () => undefined,
)

/** Set while the Changes list is mounted: moves the review cursor to what an undo restored. */
let focusUndone: ((entry: UndoEntry) => void) | null = null

/**
 * Takes back the last seen mark or deleted note on this changeset, for the Undo button and
 * Cmd/Ctrl+Z. The review cursor goes back to the objects whose marks came back.
 */
export function undoReviewStep(userKey: string, changesetId: number) {
  const entry = getChangesetNotesActions().undo(userKey, changesetId)
  if (!entry) return
  focusUndone?.(entry)
  toast(`Undone: ${entry.label}`, { id: 'review-undo' })
}

/** Mod+Z and Control+Z are one chord off a Mac: one press must undo once. */
const undoneEvents = new WeakSet<KeyboardEvent>()

function overlayIsOpen() {
  return document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]') != null
}

function bind(
  binding: HotkeyBinding,
  callback: UseHotkeyDefinition['callback'],
  options?: UseHotkeyDefinition['options'],
): UseHotkeyDefinition[] {
  return binding.hotkeys.map((hotkey) => ({ hotkey, callback, options }))
}

/** The keys of the review flow. They act on the review cursor, never on DOM focus. */
export function useReviewCursorKeys({
  changesetId,
  userKey,
  tagGroups,
  isUnseen,
  zoomToAndSelect,
  zoomToGroup,
  clearSelection,
}: {
  changesetId: number
  userKey: string
  tagGroups: TagGroups
  /** Reads the seen state at the time of the call: S moves on after marking. */
  isUnseen: (change: ElementChange) => boolean
  zoomToAndSelect: (type: string, id: number) => void
  zoomToGroup: (members: readonly ElementChange[]) => void
  clearSelection: () => void
}) {
  const router = useRouter()
  const { markAllSeen, markAllUnseen, toggleEditor } = useChangesetNotesActions()
  const { requestListScroll, clearListScrollTarget } = useChangesetHoverActions()

  /** From the router's latest location: a fast second key press comes before the next render. */
  function currentCursor() {
    const search: { ref?: string } = router.latestLocation.search
    const ref = parseRefParam(search.ref ?? '')
    return reviewCursorOf(tagGroups, getGroupCursorKey(), ref && objectRefKey(ref.type, ref.id))
  }

  function objectKeysOf({ changes }: ReviewCursor) {
    return changes.map(changeKey)
  }

  function moveCursor(cursor: ReviewCursor, anchorY?: number) {
    const [change] = cursor.changes
    if (cursor.on === 'group') {
      requestListScroll({ ...groupHeaderTarget(change), focus: true, anchorY })
      zoomToGroup(cursor.changes)
      return
    }
    requestListScroll({ type: change.type, id: change.id, focus: true, anchorY })
    zoomToAndSelect(change.type, change.id)
  }

  function moveOnFrom(cursor: ReviewCursor | null, anchorY?: number) {
    const next = nextUnseen(tagGroups, cursor, isUnseen)
    if (next) {
      moveCursor(next, anchorY)
      return
    }
    toast('All changes seen', { id: 'all-changes-seen' })
    // The last row was picked on the map; seen now, it folds like any other.
    clearListScrollTarget()
  }

  /** Back to the row, or the whole group when all its members came back. */
  function focusOnUndone(entry: UndoEntry) {
    if (entry.kind !== 'seen') return
    const keys = entry.before.map((item) => item.objectKey)
    const [first] = keys
    if (first == null) return
    const row = reviewCursorOf(tagGroups, null, first)
    const group = reviewCursorOf(tagGroups, first, null)
    const wholeGroup =
      keys.length > 1 &&
      group != null &&
      group.changes.length > 1 &&
      group.changes.every((change) => keys.includes(changeKey(change)))
    const cursor = wholeGroup ? group : row
    if (cursor) moveCursor(cursor)
  }

  const focusOnUndoneRef = useRef(focusOnUndone)
  useEffect(function registerUndoFocus() {
    focusOnUndoneRef.current = focusOnUndone
  })
  useEffect(function provideUndoFocus() {
    const focus = (entry: UndoEntry) => focusOnUndoneRef.current(entry)
    focusUndone = focus
    return function withdrawUndoFocus() {
      if (focusUndone === focus) focusUndone = null
    }
  }, [])

  const moveOnFromRef = useRef(moveOnFrom)
  useEffect(function keepMoveOnCurrent() {
    moveOnFromRef.current = moveOnFrom
  })
  const [moveOnAfterSeen] = useState(
    () => (from: ReviewCursor, anchorY?: number) => moveOnFromRef.current(from, anchorY),
  )

  function markSeenAndMoveOn() {
    const cursor = currentCursor()
    if (cursor?.changes.some(isUnseen)) markAllSeen(userKey, changesetId, objectKeysOf(cursor))
    moveOnFrom(cursor)
  }

  function markUnseen() {
    const cursor = currentCursor()
    if (cursor) markAllUnseen(userKey, changesetId, objectKeysOf(cursor))
  }

  function moveTo(step: ReviewCursor | undefined) {
    if (step) moveCursor(step)
  }

  function addNote() {
    const cursor = currentCursor()
    if (cursor?.on !== 'row') return
    const [change] = cursor.changes
    const ref = refParamFromElement(change.type, change.id)
    if (ref) toggleEditor(userKey, changesetId, ref)
  }

  useHotkeys([
    ...bind(REVIEW_MARK_SEEN, (event) => {
      // Holding the key must not run through the whole list.
      if (!event.repeat && !overlayIsOpen()) markSeenAndMoveOn()
    }),
    ...bind(REVIEW_MARK_UNSEEN, (event) => {
      if (!event.repeat && !overlayIsOpen()) markUnseen()
    }),
    ...bind(REVIEW_UNDO, (event) => {
      if (undoneEvents.has(event) || overlayIsOpen()) return
      undoneEvents.add(event)
      undoReviewStep(userKey, changesetId)
    }),
    ...bind(REVIEW_NEXT_STEP, () => {
      if (!overlayIsOpen()) moveTo(nextStep(tagGroups, currentCursor()))
    }),
    ...bind(REVIEW_PREVIOUS_STEP, () => {
      if (!overlayIsOpen()) moveTo(previousStep(tagGroups, currentCursor()))
    }),
    ...bind(REVIEW_ADD_NOTE, () => {
      if (!overlayIsOpen()) addNote()
    }),
    ...bind(
      REVIEW_STEP_INTO,
      (event) => {
        // A focused button or link keeps Enter. The cursor's focus sits on the row or the group
        // header bar, not on a button, so Enter still steps into the group after S.
        if (event.defaultPrevented || overlayIsOpen()) return
        if (document.activeElement?.closest(INTERACTIVE_SELECTOR)) return
        const member = stepInto(currentCursor(), isUnseen)
        if (!member) return
        event.preventDefault()
        moveCursor(member)
      },
      LEAVE_EVENT_ALONE,
    ),
    ...bind(
      REVIEW_STEP_OUT,
      (event) => {
        if (event.defaultPrevented || overlayIsOpen()) return
        if (getOpenEditor()?.changesetId === changesetId) return
        const cursor = currentCursor()
        if (!cursor) return
        event.preventDefault()
        const group = stepOut(tagGroups, cursor)
        if (group) {
          moveCursor(group)
          return
        }
        clearSelection()
        // The cursor is gone; a focus ring on its row would look like it is still there.
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      },
      LEAVE_EVENT_ALONE,
    ),
  ])

  return moveOnAfterSeen
}
