import { LanguageIcon } from '@heroicons/react/16/solid'
import { Tooltip } from '../ui/tooltip.tsx'

export default function TranslateButton({ text }: { text: string }) {
  return (
    <Tooltip
      href={`https://translate.google.com/#auto/en/${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      content="Translate this comment with Google Translate"
      className="min-h-11 min-w-11 justify-center rounded-lg text-zinc-950 active:bg-zinc-950/5 hover-fine:bg-zinc-950/5"
    >
      <LanguageIcon className="size-4" />
    </Tooltip>
  )
}
