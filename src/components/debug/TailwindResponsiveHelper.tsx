import { adminChipClassName } from './adminChip.ts'
import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'

export function TailwindResponsiveHelper() {
  if (!areDebugPanelsEnabled()) return null

  return (
    <a
      className={`fixed bottom-1 left-1/2 z-30 -translate-x-1/2 space-x-1 hover:underline ${adminChipClassName}`}
      href="https://tailwindcss.com/docs/responsive-design"
      target="_blank"
      rel="noreferrer"
    >
      <span className="font-bold underline" title="<40rem">
        📱
      </span>
      <span className="sm:font-bold sm:underline" title="40rem sm">
        sm
      </span>
      <span className="md:font-bold md:underline" title="48rem md">
        md
      </span>
      <span className="min-[56rem]:font-bold min-[56rem]:underline" title="56rem layout split">
        56
      </span>
      <span className="lg:font-bold lg:underline" title="64rem lg">
        lg
      </span>
      <span className="xl:font-bold xl:underline" title="80rem xl">
        xl
      </span>
      <span className="2xl:font-bold 2xl:underline" title="96rem 2xl">
        2xl
      </span>
    </a>
  )
}
