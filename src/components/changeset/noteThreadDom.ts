export const NOTE_THREAD_FLASH_MS = 1500

export function noteThreadDomId(type: string, id: number, key?: string): string {
  return key == null ? `note-thread-${type}-${id}` : `note-thread-${type}-${id}-${key}`
}

/** The group's thread for a tag key. `type` and `id` name the group's first member. */
export function groupThreadDomId(type: string, id: number, key: string): string {
  return `note-thread-group-${type}-${id}-${key}`
}

const FLASH_CLASS_NAMES = ['ring-2', 'ring-zinc-400', 'ring-offset-1']

/**
 * Flash a thread that another component owns: the group panel flashes the notes inside its member
 * rows this way. Threads a component renders itself flash through their `flash` prop instead.
 */
export function flashNoteThreadElement(element: HTMLElement | null) {
  if (!element) return
  element.classList.add(...FLASH_CLASS_NAMES)
  window.setTimeout(() => element.classList.remove(...FLASH_CLASS_NAMES), NOTE_THREAD_FLASH_MS)
}
