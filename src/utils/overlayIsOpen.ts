/**
 * A dialog, menu or listbox is open. Single-key shortcuts must then stay quiet: Headless UI menus
 * use letters for typeahead without stopping them, so `b` in an open menu would also mark the
 * changeset as needing a look.
 */
export function overlayIsOpen() {
  return document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]') != null
}

/** Wraps a shortcut callback so it does nothing while an overlay is open. */
export function unlessOverlayOpen<Args extends unknown[]>(callback: (...args: Args) => void) {
  return (...args: Args) => {
    if (!overlayIsOpen()) callback(...args)
  }
}
