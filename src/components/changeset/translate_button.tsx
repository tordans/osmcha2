import { TouchTarget } from '../ui/button.tsx'
import { LanguageIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'

/** Tiny language icon in the parent’s top-right. Parent must be `relative`. */
export default function TranslateButton({ text }: { text: string }) {
  return (
    <div className="absolute top-0.5 right-0 z-10">
      <Tooltip
        href={`https://translate.google.com/#auto/en/${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        placement="bottom-end"
        content="Translate this comment with Google Translate"
        className="relative origin-top-right justify-center rounded text-zinc-400 transition-transform duration-150 active:bg-zinc-950/5 motion-reduce:transition-none hover-fine:scale-150 hover-fine:bg-zinc-950/5 hover-fine:text-zinc-950"
      >
        <TouchTarget>
          <LanguageIcon className="size-4" />
        </TouchTarget>
      </Tooltip>
    </div>
  )
}
