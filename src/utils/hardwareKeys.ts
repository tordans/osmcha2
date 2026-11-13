import { useSyncExternalStore } from 'react'

/**
 * Is a hardware keyboard there? A web page cannot ask: `(any-pointer: fine)` tells a trackpad or a
 * mouse, not a keyboard, and an iPad with a Smart Keyboard Folio has no pointer at all. A page
 * learns it only from the first key that only a hardware keyboard sends. Until then a touch device
 * shows no shortcut hints: "Mark as seen (S)" is no help without an S to press.
 *
 * `data-keys` on <html> says a keyboard is there: set at once with a fine pointer, and on a touch
 * device at its first hardware key. It stays for the visit. CSS uses `keys:` and `nokeys:`
 * (index.css), React code `useKeyboardKnown()`.
 *
 * Ported from Maid (packages/shell/src/hardware-keys.ts).
 */

/** What a key press tells: the parts of a `KeyboardEvent` read here, and whether a text field had the focus */
export type KeyPress = {
  key: string
  shiftKey: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  isComposing?: boolean
  /** The focus is in a text field, where the on-screen keyboard types too */
  typing: boolean
}

/** Keys that are only on a hardware keyboard: the on-screen keyboards of iOS and Android send none of them */
const HARDWARE_ONLY = new Set([
  'Shift',
  'Alt',
  'Control',
  'Meta',
  'CapsLock',
  'Escape',
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Delete',
])

/**
 * True when the press came from a hardware keyboard. Outside a text field the on-screen keyboard
 * is closed, so any key is the hardware's. In a field the on-screen keyboard types letters and
 * Backspace, and an Android one sends `Unidentified` while it composes; only a modifier, a
 * function key or a hardware-only key is the hardware's there.
 */
export function isHardwareKey(press: KeyPress): boolean {
  if (press.isComposing || press.key === 'Unidentified' || press.key === 'Process') return false
  if (!press.typing) return true
  if (press.altKey || press.ctrlKey || press.metaKey) return true
  return HARDWARE_ONLY.has(press.key) || /^F\d{1,2}$/.test(press.key)
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  )
}

const listeners = new Set<() => void>()

function markKeyboard(root: HTMLElement) {
  if ('keys' in root.dataset) return
  root.dataset.keys = ''
  for (const listener of listeners) listener()
}

/**
 * Sets `data-keys` on <html> now when `keyboard` (a fine pointer), else at the first hardware key
 * press. Returns the function that stops listening.
 */
export function watchHardwareKeys(keyboard: boolean, root = document.documentElement) {
  if (keyboard) {
    markKeyboard(root)
    return () => {}
  }
  const onKey = (event: KeyboardEvent) => {
    const { key, shiftKey, altKey, ctrlKey, metaKey, isComposing } = event
    const press = { key, shiftKey, altKey, ctrlKey, metaKey, isComposing }
    if (!isHardwareKey({ ...press, typing: isTyping(event.target) })) return
    markKeyboard(root)
    window.removeEventListener('keydown', onKey, true)
  }
  window.addEventListener('keydown', onKey, true)
  return () => window.removeEventListener('keydown', onKey, true)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function keyboardKnown() {
  return typeof document !== 'undefined' && 'keys' in document.documentElement.dataset
}

/** Whether a hardware keyboard is known, for texts that name a key: "Mark as seen (S)". */
export function useKeyboardKnown() {
  return useSyncExternalStore(subscribe, keyboardKnown, () => false)
}

/** `label (key)` once a keyboard is known, else the label alone. */
export function withKeyHint(label: string, key: string, keyboard: boolean) {
  return keyboard ? `${label} (${key})` : label
}
