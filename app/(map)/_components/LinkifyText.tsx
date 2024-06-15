import { Link } from '@app/_components/core/link'
import 'linkify-plugin-hashtag'
import 'linkify-plugin-mention'
import Linkify from 'linkify-react'

type Props = {
  text: string
  nl2br?: boolean
}

export const LinkifyText = ({ text, nl2br = false }: Props) => {
  return (
    <Linkify
      options={{
        render: renderLink,
        formatHref: {
          hashtag: (hashtag) =>
            // Other option would be ?filters={"metadata":[{"label":"hashtags=${hashtag}","value":"hashtags=${hashtag}"}]}
            `/?filters={"comment":[{"label":"${hashtag}","value":"${hashtag}"}]}'`,
          mention: (mention) => `https://www.openstreetmap.org/user${mention}`,
        },
        nl2br,
      }}
    >
      {text}
    </Linkify>
  )
}

const renderLink = ({
  attributes,
  content,
}: {
  // TS: `any` for some reason the `LinkProps<R>` solution we use in link.tsx does result in erros. Since type safety is unimportant here, we can "`any`"-ignore it…
  attributes: any
  content: string
}) => {
  return (
    <Link
      textLink
      {...attributes}
      target={attributes.href.includes('http') ? '_blank' : undefined}
      className="break-all"
    >
      {content}
    </Link>
  )
}
