import { RelativeTime } from '@app/(map)/_components/Changeset/RelativeTime'
import { DebugDataHelperDialog } from '@app/(map)/_components/debugHelper/DebugDataHelperDialog'
import { LinkifyText } from '@app/(map)/_components/LinkifyText'
import { TranslateButton } from '@app/(map)/_components/TranslateButton'
import { TOsmOrgChangeset } from '@app/(map)/_data/OsmOrgChangeset.zod'
import { Link } from '@app/_components/core/link'
import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'

type Props = {
  osmOrgChangeset: TOsmOrgChangeset
}

export const DetailsComments = ({ osmOrgChangeset }: Props) => {
  const changesetUser = osmOrgChangeset.elements[0].user
  const discussions = osmOrgChangeset.elements[0].discussion

  return (
    <section className="mt-4">
      {discussions?.map((discussion) => {
        const isChangesetUser = discussion.user === changesetUser
        return (
          <div
            key={discussion.id}
            className="border-b-zinc-40 relative mb-4 border-b pb-4 last:border-b-0"
          >
            <div className="flex items-center justify-between gap-1">
              <h4 className="flex items-center gap-1 font-semibold text-zinc-700">
                <ChatBubbleLeftIcon className="size-4" />
                <span>
                  Comment by{' '}
                  <Link
                    textLink
                    href={`https://www.openstreetmap.org/user/${discussion.user}`}
                    target="_blank"
                  >
                    {discussion.user}
                  </Link>{' '}
                  {isChangesetUser ? '(changeset author)' : ''}{' '}
                  <RelativeTime date={discussion.date} />:
                </span>
              </h4>
              <TranslateButton
                text={discussion.text}
                toLocale={osmOrgChangeset.elements[0].tags?.locale}
              />
            </div>

            <p
              className="mt-1 border-l-2 border-l-zinc-200 py-1 pl-2"
              // CSS Solution for `<br>` in text,
              //    see https://www.dhiwise.com/post/react-line-break-techniques-for-better-text-formatting
              // A custom Br2nl component did not work,
              //    see https://github.com/Hypercontext/linkifyjs/discussions/482
              style={{ whiteSpace: 'pre-line', marginLeft: '4px' }}
            >
              <LinkifyText text={discussion.text} />
            </p>
            <DebugDataHelperDialog data={discussion} title="Comment" />
          </div>
        )
      })}
    </section>
  )
}
