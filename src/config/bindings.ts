import type { RegisterableHotkeyChord } from '@tanstack/react-hotkeys'
import type { NonEmptyArray } from '../utils/nonEmptyArray.ts'

export type HotkeyBinding = {
  label: string
  hotkeys: NonEmptyArray<RegisterableHotkeyChord>
}

export function bindingKey(binding: HotkeyBinding): string {
  const [hotkey] = binding.hotkeys
  return typeof hotkey === 'string' ? hotkey : (hotkey.key ?? '')
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

export const REVIEW_MARK_SEEN: HotkeyBinding = {
  label: 'REVIEW_MARK_SEEN',
  hotkeys: ['S'],
}

export const REVIEW_MARK_UNSEEN: HotkeyBinding = {
  label: 'REVIEW_MARK_UNSEEN',
  hotkeys: ['Shift+S'],
}

export const REVIEW_NEXT_STEP: HotkeyBinding = {
  label: 'REVIEW_NEXT_STEP',
  hotkeys: ['.'],
}

export const REVIEW_PREVIOUS_STEP: HotkeyBinding = {
  label: 'REVIEW_PREVIOUS_STEP',
  hotkeys: [','],
}

export const REVIEW_STEP_INTO: HotkeyBinding = {
  label: 'REVIEW_STEP_INTO',
  hotkeys: ['Enter'],
}

export const REVIEW_STEP_OUT: HotkeyBinding = {
  label: 'REVIEW_STEP_OUT',
  hotkeys: ['Escape'],
}

export const REVIEW_ADD_NOTE: HotkeyBinding = {
  label: 'REVIEW_ADD_NOTE',
  hotkeys: ['N'],
}
