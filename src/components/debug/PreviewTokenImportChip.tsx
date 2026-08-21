import { useSyncExternalStore } from 'react'
import {
  getPreviewTokenImport,
  setPreviewTokenImport,
  subscribePreviewTokenImport,
} from '../../utils/previewTokenImport.ts'
import { adminChipClassName } from './adminChip.ts'

function getSnapshot() {
  return getPreviewTokenImport()
}

function getServerSnapshot() {
  return false
}

/** Local-only: force the GitHub Pages token-paste UI on localhost. */
export function PreviewTokenImportChip() {
  const enabled = useSyncExternalStore(subscribePreviewTokenImport, getSnapshot, getServerSnapshot)

  return (
    <button
      type="button"
      aria-pressed={enabled}
      title="Preview GitHub Pages token-paste UI. Sign out first if you are already signed in. Off in production builds."
      className={`${adminChipClassName} cursor-pointer ${enabled ? 'font-bold underline' : ''}`}
      onClick={() => {
        setPreviewTokenImport(!enabled)
      }}
    >
      token UI
    </button>
  )
}
