type DebugPanelEnv = {
  DEV?: boolean
  OSMCHA_ENABLE_DEBUG_PANELS?: string
  VITE_OSMCHA_ENABLE_DEBUG_PANELS?: string
}

function readFlag(value: string | undefined): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

/** Pink JSON inspectors: on in `import.meta.env.DEV`, overridable via env flags. */
export function areDebugPanelsEnabled(env: DebugPanelEnv = import.meta.env): boolean {
  const forced =
    readFlag(env.OSMCHA_ENABLE_DEBUG_PANELS) ?? readFlag(env.VITE_OSMCHA_ENABLE_DEBUG_PANELS)
  if (forced !== undefined) return forced
  return Boolean(env.DEV)
}
