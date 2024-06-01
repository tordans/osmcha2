import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'

type Props = { commentCount: undefined | number } // TODO TYPES

export const ChangesetCommentIndicator = ({ commentCount }: Props) => {
  if (!commentCount) return null
  return (
    <span>
      <ChatBubbleLeftIcon className="size-4" /> {commentCount}
    </span>
  )
}
