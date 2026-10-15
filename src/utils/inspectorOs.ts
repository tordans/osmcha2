export type InspectorOs = 'mac' | 'windows' | 'linux'

type NavigatorHints = {
  userAgent: string
  platform?: string
  userAgentDataPlatform?: string
}

/** Chrome / Edge shortcut to show the bookmarks bar. */
export function bookmarksBarShortcut(os: InspectorOs): { keys: string[]; ariaLabel: string } {
  if (os === 'mac') return { keys: ['⌘', '⇧', 'B'], ariaLabel: 'Command-Shift-B' }
  return { keys: ['Ctrl', 'Shift', 'B'], ariaLabel: 'Control-Shift-B' }
}

export function inspectorOsFromNavigator(hints: NavigatorHints): InspectorOs {
  const uaData = hints.userAgentDataPlatform?.toLowerCase() ?? ''
  if (uaData.includes('mac')) return 'mac'
  if (uaData.includes('win')) return 'windows'
  if (uaData.includes('linux') || uaData.includes('chrome os')) return 'linux'

  const haystack = `${hints.platform ?? ''} ${hints.userAgent}`
  if (/Mac|iPhone|iPad|iPod/.test(haystack)) return 'mac'
  if (/Win/.test(haystack)) return 'windows'
  return 'linux'
}

export function inspectorOs(): InspectorOs {
  if (typeof navigator === 'undefined') return 'linux'
  const uaDataPlatform = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData?.platform
  return inspectorOsFromNavigator({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    userAgentDataPlatform: uaDataPlatform,
  })
}
