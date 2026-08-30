import { useState } from 'react'
import { TanStackAppDevtools } from '../shared/devtools/TanStackAppDevtools.tsx'
import { XMarkIcon } from '../ui/icons.ts'
import {
  adminChipClassName,
  adminChipSegmentClassName,
  adminChipSeparatorClassName,
} from './adminChip.ts'
import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'
import { PreviewTokenImportChip } from './PreviewTokenImportChip.tsx'
import { TailwindResponsiveHelper } from './TailwindResponsiveHelper.tsx'

function AdminChipSeparator() {
  return <span className={adminChipSeparatorClassName} aria-hidden="true" />
}

function openTanStackDevtools() {
  document
    .querySelector<HTMLButtonElement>('button[aria-label="Open TanStack Devtools"]')
    ?.click()
}

export function DebugOverlay() {
  const [visible, setVisible] = useState(true)

  if (!areDebugPanelsEnabled() || !visible) return null

  return (
    <>
      <TanStackAppDevtools />
      <div
        className={`fixed bottom-1 left-1 z-30 ${adminChipClassName}`}
      >
        <button
          type="button"
          title="Open TanStack Devtools"
          className={`${adminChipSegmentClassName} cursor-pointer`}
          onClick={openTanStackDevtools}
        >
          TanStack
        </button>
        <AdminChipSeparator />
        <TailwindResponsiveHelper />
        <AdminChipSeparator />
        <PreviewTokenImportChip />
        <AdminChipSeparator />
        <button
          type="button"
          aria-label="Dismiss admin bar"
          title="Dismiss admin bar"
          className={`${adminChipSegmentClassName} cursor-pointer`}
          onClick={() => setVisible(false)}
        >
          <XMarkIcon className="size-3" />
        </button>
      </div>
    </>
  )
}
