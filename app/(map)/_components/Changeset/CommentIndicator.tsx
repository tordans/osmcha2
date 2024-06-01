import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'
import { TOsmChaChangesetProperties } from './zod/osmChaChangeset'

type Props = { commentCount: TOsmChaChangesetProperties['comments_count'] }

export const ChangesetCommentIndicator = ({ commentCount }: Props) => {
  if (!commentCount) return null
  return (
    <span aria-label={`${commentCount} comments`}>
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
