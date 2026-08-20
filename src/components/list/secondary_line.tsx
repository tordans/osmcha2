import { Badge } from '../ui/badge.tsx'
import { hasResolvedTag } from './ReviewStatusBadge.tsx'

type NamedTag = { id?: number; name: string }

interface SecondaryLineProps {
  checked?: boolean
  reasons?: NamedTag[]
  tags?: NamedTag[]
}

export function SecondaryLine({ checked, reasons = [], tags = [] }: SecondaryLineProps) {
  const resolved = hasResolvedTag(tags)
  const showReasons = !checked && reasons.length > 0
  const showTags = !resolved && tags.length > 0

  if (!showReasons && !showTags) return null

  return (
    <div className="flex flex-col gap-2">
      {showReasons ? (
        <div className="flex flex-wrap items-center gap-1">
          {reasons.map((reason) => (
            <Badge key={reason.id ?? reason.name}>{reason.name}</Badge>
          ))}
        </div>
      ) : null}
      {showTags ? (
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <Badge key={tag.id ?? tag.name}>{tag.name}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
