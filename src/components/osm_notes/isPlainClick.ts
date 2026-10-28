/**
 * A plain left click or tap. Modified clicks (cmd/ctrl/shift/alt) and non-primary buttons
 * keep the browser's "open in a new tab or window"; a long press opens the context menu.
 */
export function isPlainClick(event: {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented?: boolean
}) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  )
}
