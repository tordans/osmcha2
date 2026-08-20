import Linkify from 'linkify-react'
import 'linkify-plugin-mention'
import type { IntermediateRepresentation } from 'linkifyjs'
import { RouterLink } from '../../routing/RouterLink.tsx'
import { hashtagCommentSearch, osmUserHrefFromMention } from './linkifyHrefs.ts'
import './osmHashtagPlugin.ts'

type Props = {
  text: string
  nl2br?: boolean
}

const linkClass = 'text-blue-700 underline break-all'

function renderExternal({ attributes, content }: IntermediateRepresentation) {
  return (
    <a {...attributes} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {content}
    </a>
  )
}

function renderHashtag({ attributes, content }: IntermediateRepresentation) {
  const { href: _href, ...rest } = attributes
  return (
    <RouterLink {...rest} to="/" search={hashtagCommentSearch(content)} className={linkClass}>
      {content}
    </RouterLink>
  )
}

export function LinkifyText({ text, nl2br = false }: Props) {
  return (
    <Linkify
      options={{
        nl2br,
        formatHref: {
          mention: osmUserHrefFromMention,
        },
        render: {
          url: renderExternal,
          email: renderExternal,
          mention: renderExternal,
          hashtag: renderHashtag,
        },
      }}
    >
      {text}
    </Linkify>
  )
}
