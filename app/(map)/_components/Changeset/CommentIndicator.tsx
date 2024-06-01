import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'
import { TOsmChaChangesetProperties } from './zod/OsmChaChangeset.zod'

type Props = { commentCount: TOsmChaChangesetProperties['comments_count'] }

export const ChangesetCommentIndicator = ({ commentCount }: Props) => {
  if (!commentCount) return null
  return (
    <span aria-label={`${commentCount} comments`} className="flex flex-none items-center gap-1">
      <ChatBubbleLeftIcon className="size-4" /> {commentCount}
    </span>
  )
}

export const ChangesetNoCommentIndicator = ({ commentCount }: Props) => {
  if (commentCount) return null
  return (
    <span aria-label="No Comments">
      <ChatBubbleLeftIcon className="size-4 text-gray-200" />
    </span>
  )
}
