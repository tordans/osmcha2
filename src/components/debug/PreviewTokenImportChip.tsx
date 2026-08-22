import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TokenImport } from '../token_import.tsx'
import { adminChipClassName } from './adminChip.ts'

const STORAGE_KEY = 'osmcha-preview-token-import'

function readPreviewEnabled() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writePreviewEnabled(enabled: boolean) {
  try {
    if (enabled) sessionStorage.setItem(STORAGE_KEY, '1')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private mode or blocked storage: keep the in-memory toggle only.
  }
}

/** Local-only overlay so we can inspect the GitHub Pages paste UI on localhost. */
export function PreviewTokenImportChip() {
  const [enabled, setEnabled] = useState(readPreviewEnabled)

  function togglePreview() {
    const next = !enabled
    writePreviewEnabled(next)
    setEnabled(next)
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={enabled}
        title={
          enabled
            ? 'Hide GitHub Pages token-paste preview'
            : 'Show GitHub Pages token-paste preview'
        }
        className={`${adminChipClassName} cursor-pointer ${enabled ? 'font-bold' : 'opacity-70'}`}
        onClick={togglePreview}
      >
        token UI {enabled ? 'on' : 'off'}
      </button>
      {enabled
        ? createPortal(
            <div className="fixed inset-0 z-40 flex items-center justify-center p-3">
              <button
                type="button"
                className="absolute inset-0 bg-zinc-950/40"
                aria-label="Close token UI preview"
                onClick={togglePreview}
              />
              <div
                role="dialog"
                aria-label="GitHub Pages token-paste preview"
                className="relative flex h-full max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-zinc-950/10"
              >
                <p className="shrink-0 border-b border-zinc-950/10 bg-pink-300 px-3 py-1.5 text-xs font-medium text-zinc-950">
                  token UI on — GitHub Pages paste preview
                </p>
                <TokenImport layout="sheet" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
