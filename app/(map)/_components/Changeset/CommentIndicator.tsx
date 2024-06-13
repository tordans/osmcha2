import { TOsmOrgChangeset } from '@app/(map)/_data/OsmOrgChangeset.zod'
import { Badge } from '@app/_components/core/badge'
import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'

type Props = { commentCount: TOsmOrgChangeset['elements'][number]['comments_count'] }

export const CommentIndicator = ({ commentCount }: Props) => {
  if (!commentCount) return null
  return (
    <Badge aria-label={`${commentCount} comments`} className="flex flex-none items-center gap-1">
      <ChatBubbleLeftIcon className="size-4" /> {commentCount}
    </Badge>
  )
}

export const NoCommentIndicator = () => {
  return (
    <span aria-label="No Comments">
      <ChatBubbleLeftIcon className="size-4 text-gray-200" />
    </span>
  )
}
