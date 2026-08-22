import { describe, expect, it } from 'vitest'
import {
  bookmarksBarShortcut,
  consoleShortcut,
  devToolsShortcut,
  inspectorOsFromNavigator,
} from './inspectorOs.ts'

describe('inspectorOsFromNavigator', () => {
  it('prefers userAgentData.platform', () => {
    expect(
      inspectorOsFromNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
        userAgentDataPlatform: 'macOS',
      }),
    ).toBe('mac')
    expect(
      inspectorOsFromNavigator({
        userAgent: 'Mozilla/5.0 (Macintosh)',
        userAgentDataPlatform: 'Windows',
      }),
    ).toBe('windows')
    expect(
      inspectorOsFromNavigator({
        userAgent: 'Mozilla/5.0 (Macintosh)',
        userAgentDataPlatform: 'Linux',
      }),
    ).toBe('linux')
  })

  it('falls back to platform and userAgent', () => {
    expect(inspectorOsFromNavigator({ userAgent: 'Mozilla/5.0', platform: 'MacIntel' })).toBe('mac')
    expect(
      inspectorOsFromNavigator({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        platform: 'Win32',
      }),
    ).toBe('windows')
    expect(
      inspectorOsFromNavigator({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        platform: 'Linux x86_64',
      }),
    ).toBe('linux')
  })
})

describe('shortcuts', () => {
  it('returns Console shortcuts for this OS only', () => {
    expect(consoleShortcut('mac')).toEqual({ keys: ['⌥', '⌘', 'J'], ariaLabel: 'Option-Command-J' })
    expect(consoleShortcut('windows').keys).toEqual(['Ctrl', 'Shift', 'J'])
    expect(consoleShortcut('linux').keys).toEqual(['Ctrl', 'Shift', 'J'])
  })

  it('returns DevTools shortcuts for this OS only', () => {
    expect(devToolsShortcut('mac').keys).toEqual(['⌥', '⌘', 'I'])
    expect(devToolsShortcut('windows').keys).toEqual(['F12'])
    expect(devToolsShortcut('linux').keys).toEqual(['Ctrl', 'Shift', 'I'])
  })

  it('returns bookmarks-bar shortcuts for this OS only', () => {
    expect(bookmarksBarShortcut('mac').keys).toEqual(['⌘', '⇧', 'B'])
    expect(bookmarksBarShortcut('windows').keys).toEqual(['Ctrl', 'Shift', 'B'])
    expect(bookmarksBarShortcut('linux').keys).toEqual(['Ctrl', 'Shift', 'B'])
  })
})
