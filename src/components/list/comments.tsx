import { Badge } from '../ui/badge.tsx'
import { ChatBubbleLeftIcon } from '../ui/icons.ts'

export function NumberOfComments({ count }: { count?: number }) {
  if (!count) return null

  return (
    <Badge aria-label={`${count} comments`} className="h-6 flex-none">
      <ChatBubbleLeftIcon variant="fill" className="size-4" /> {count}
    </Badge>
  )
}
