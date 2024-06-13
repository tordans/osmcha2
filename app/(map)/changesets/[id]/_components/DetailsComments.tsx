import { RelativeTime } from '@app/(map)/_components/Changeset/RelativeTime'
import { DebugDataHelperDialog } from '@app/(map)/_components/debugHelper/DebugDataHelperDialog'
import { LinkifyText } from '@app/(map)/_components/LinkifyText'
import { TOsmOrgChangeset } from '@app/(map)/_data/OsmOrgChangeset.zod'
import { Link } from '@app/_components/core/link'
import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'

type Props = { discussions: TOsmOrgChangeset['elements'][number]['discussion'] }

export const DetailsComments = ({ discussions }: Props) => {
  return (
    <section className="mt-4">
      {discussions?.map((discussion) => {
        return (
          <div
            key={discussion.id}
            className="border-b-zinc-40 relative mb-4 border-b pb-4 last:border-b-0"
          >
            <h4 className="flex items-center gap-1 font-semibold text-zinc-700">
              <ChatBubbleLeftIcon className="size-4" />
              Comment by{' '}
              <Link
                textLink
                href={`https://www.openstreetmap.org/user/${discussion.user}`}
                target="_blank"
              >
                {discussion.user}
              </Link>{' '}
              <RelativeTime date={discussion.date} />:
            </h4>

            <p
              className="mt-1 border-l-2 border-l-zinc-200 py-1 pl-2"
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
