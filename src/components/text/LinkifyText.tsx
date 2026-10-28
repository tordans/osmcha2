import Linkify from 'linkify-react'
import 'linkify-plugin-mention'
import type { IntermediateRepresentation } from 'linkifyjs'
import { splitByOsmNoteRefs } from '../../notes/osmNoteRefs.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import { OsmNoteLink } from '../osm_notes/OsmNoteLink.tsx'
import { hashtagCommentSearch, osmUserHrefFromMention } from './linkifyHrefs.ts'
import './osmHashtagPlugin.ts'

type Props = {
  text: string
  nl2br?: boolean
  /** Make OSM note references (URLs, `note/123`, `note #123`) open the note quick view. */
  osmNotes?: boolean
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

function LinkifyRun({ text, nl2br }: { text: string; nl2br: boolean }) {
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

export function LinkifyText({ text, nl2br = false, osmNotes = false }: Props) {
  if (!osmNotes) return <LinkifyRun text={text} nl2br={nl2br} />
  return (
    <>
      {splitByOsmNoteRefs(text).map((segment) =>
        segment.type === 'note' ? (
          <OsmNoteLink key={segment.start} noteId={segment.id} className={linkClass}>
            {segment.text}
          </OsmNoteLink>
        ) : (
          <LinkifyRun key={segment.start} text={segment.text} nl2br={nl2br} />
        ),
      )}
    </>
  )
}
