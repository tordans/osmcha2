import { Button } from '@app/_components/core/button'
import { LanguageIcon } from '@heroicons/react/16/solid'

type Props = {
  text: string
  toLocale?: string
}

export const TranslateButton = ({ text, toLocale = 'en' }: Props) => {
  return (
    <Button
      outline
      target="_blank"
      href={`http://translate.google.com/#auto/${toLocale}/${encodeURIComponent(text)}`}
      className="!px-1.5 !py-0"
    >
      <LanguageIcon className="size-3" />
      <span className="sr-only">Translate</span>
    </Button>
  )
}
