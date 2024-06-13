import { Button } from '@app/_components/core/button'
import { LanguageIcon } from '@heroicons/react/16/solid'
import { LinkProps } from 'next/link'

export const translateUrl = <R extends string>(
  text: string,
  toLocale: string = 'en',
): LinkProps<R>['href'] => {
  return `http://translate.google.com/#auto/${toLocale}/${encodeURIComponent(text)}`
}

type Props = {
  text: string
  toLocale?: string
}

export const TranslateButton = ({ text, toLocale }: Props) => {
  return (
    <Button
      outline
      target="_blank"
      href={translateUrl(text, toLocale)}
      className="!px-1.5 !py-0"
      title="Translate text with Google Translate"
    >
      <LanguageIcon className="size-3" />
      <span className="sr-only">Translate</span>
    </Button>
  )
}
