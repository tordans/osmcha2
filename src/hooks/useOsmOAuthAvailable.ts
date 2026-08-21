import { useSyncExternalStore } from 'react'
import { areDebugPanelsEnabled } from '../components/debug/areDebugPanelsEnabled.ts'
import { isOsmOAuthHost } from '../utils/auth.ts'
import { getPreviewTokenImport, subscribePreviewTokenImport } from '../utils/previewTokenImport.ts'

function getPreviewTokenImportSnapshot() {
  return areDebugPanelsEnabled() && getPreviewTokenImport()
}

function getPreviewTokenImportServerSnapshot() {
  return false
}

/** True when this origin can complete OSM OAuth and the local token-UI preview is off. */
export function useOsmOAuthAvailable() {
  const previewTokenImport = useSyncExternalStore(
    subscribePreviewTokenImport,
    getPreviewTokenImportSnapshot,
    getPreviewTokenImportServerSnapshot,
  )
  return isOsmOAuthHost() && !previewTokenImport
}
