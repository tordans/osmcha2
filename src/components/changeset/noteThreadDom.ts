export const NOTE_THREAD_FLASH_MS = 1500

export function noteThreadDomId(type: string, id: number, key?: string): string {
  return key == null ? `note-thread-${type}-${id}` : `note-thread-${type}-${id}-${key}`
}
