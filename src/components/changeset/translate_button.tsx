import { LanguageIcon } from '@heroicons/react/16/solid'
import { Button } from '../ui/button.tsx'

export default function TranslateButton({ text }: { text: string }) {
  return (
    <Button
      plain
      href={`https://translate.google.com/#auto/en/${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Translate"
      className="min-h-11 cursor-pointer touch-manipulation select-none"
    >
      Translate
      <LanguageIcon data-slot="icon" />
    </Button>
  )
}
