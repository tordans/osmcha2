import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'
import { PreviewTokenImportChip } from './PreviewTokenImportChip.tsx'
import { TailwindResponsiveHelper } from './TailwindResponsiveHelper.tsx'

export function DebugOverlay() {
  if (!areDebugPanelsEnabled()) return null

  return (
    <div className="fixed bottom-1 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 print:hidden">
      <TailwindResponsiveHelper />
      <PreviewTokenImportChip />
    </div>
  )
}
