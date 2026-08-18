import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'
import { Badge } from '../ui/badge.tsx'

export function NumberOfComments({ count }: { count?: number }) {
  if (!count) return null

  return (
    <Badge aria-label={`${count} comments`} className="flex flex-none items-center gap-1">
      <ChatBubbleLeftIcon className="size-4" /> {count}
    </Badge>
  )
}
