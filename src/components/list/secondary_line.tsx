import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import { Badge } from '../ui/badge.tsx'

type NamedTag = { id?: number; name: string }

interface SecondaryLineProps {
  checked?: boolean
  checkUser?: string | null
  harmful?: boolean | null
  reasons?: NamedTag[]
  tags?: NamedTag[]
}

const RESOLVED_TAG_ID = 9

function hasResolvedTag(tags: NamedTag[]) {
  return tags.some((tag) => tag.id === RESOLVED_TAG_ID)
}

export function SecondaryLine({
  checked,
  checkUser,
  harmful,
  reasons = [],
  tags = [],
}: SecondaryLineProps) {
  const resolved = hasResolvedTag(tags)

  return (
    <div className="flex flex-col gap-2">
      {checked ? (
        <Badge color={resolved ? 'green' : harmful ? 'orange' : 'green'}>
          {harmful ? (
            <HandThumbDownIcon className="size-4" />
          ) : (
            <HandThumbUpIcon className="size-4" />
          )}{' '}
          by {checkUser || <i>Unknown user</i>}
        </Badge>
      ) : (
        reasons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {reasons.map((reason) => (
              <Badge key={reason.id ?? reason.name}>{reason.name}</Badge>
            ))}
          </div>
        )
      )}
      {!resolved && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <Badge key={tag.id ?? tag.name}>{tag.name}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}
