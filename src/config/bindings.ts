import type { RegisterableHotkey } from '@tanstack/react-hotkeys'

export type HotkeyBinding = {
  label: string
  hotkeys: RegisterableHotkey[]
}

export function bindingKey(binding: HotkeyBinding): string {
  const hotkey = binding.hotkeys[0]
  return typeof hotkey === 'string' ? hotkey : hotkey.key
}

export const FILTER_BINDING: HotkeyBinding = {
  label: 'FILTER_BINDING',
  hotkeys: ['\\'],
}

export const HELP_BINDING: HotkeyBinding = {
  label: 'HELP_BINDING',
  hotkeys: ['/', { key: '?' }],
}

export const NEXT_CHANGESET: HotkeyBinding = {
  label: 'NEXT_CHANGESET',
  hotkeys: ['ArrowDown', 'ArrowRight'],
}

export const PREV_CHANGESET: HotkeyBinding = {
  label: 'PREV_CHANGESET',
  hotkeys: ['ArrowUp', 'ArrowLeft'],
}

export const REFRESH_CHANGESETS: HotkeyBinding = {
  label: 'REFRESH_CHANGESETS',
  hotkeys: ['R'],
}

export const CHANGESET_DETAILS_DETAILS: HotkeyBinding = {
  label: 'CHANGESET_DETAILS_DETAILS',
  hotkeys: ['1'],
}

export const CHANGESET_DETAILS_DISCUSSIONS: HotkeyBinding = {
  label: 'CHANGESET_DETAILS_DISCUSSIONS',
  hotkeys: ['2'],
}

export const CHANGESET_DETAILS_MAP: HotkeyBinding = {
  label: 'CHANGESET_DETAILS_MAP',
  hotkeys: ['8'],
}

export const VERIFY_GOOD: HotkeyBinding = {
  label: 'VERIFY_GOOD',
  hotkeys: ['G'],
}

export const VERIFY_BAD: HotkeyBinding = {
  label: 'VERIFY_BAD',
  hotkeys: ['B'],
}

export const VERIFY_CLEAR: HotkeyBinding = {
  label: 'VERIFY_CLEAR',
  hotkeys: ['C', 'U'],
}

export const OPEN_IN_JOSM: HotkeyBinding = {
  label: 'OPEN_IN_JOSM',
  hotkeys: ['J'],
}

export const OPEN_IN_ID: HotkeyBinding = {
  label: 'OPEN_IN_ID',
  hotkeys: ['I'],
}

export const OPEN_IN_OSM: HotkeyBinding = {
  label: 'OPEN_IN_OSM',
  hotkeys: ['O'],
}

export const OPEN_IN_LEVEL0: HotkeyBinding = {
  label: 'OPEN_IN_LEVEL0',
  hotkeys: ['L'],
}

export const OPEN_IN_ACHAVI: HotkeyBinding = {
  label: 'OPEN_IN_ACHAVI',
  hotkeys: ['V'],
}

export const OPEN_IN_HDYC: HotkeyBinding = {
  label: 'OPEN_IN_HDYC',
  hotkeys: ['H'],
}

export const FILTER_BY_USER: HotkeyBinding = {
  label: 'FILTER_BY_USER',
  hotkeys: ['A'],
}
