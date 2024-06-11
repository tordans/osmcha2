import { localDateTimeWithRelative } from '@app/(map)/_layout/_utils/localDateTime'
import { Badge } from '@components/core/badge'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'

type Props = {
  checkDate: Date | null
  harmful: null | false | true
  user: null | string
}

export const BadgeCheckedBy = ({ checkDate, harmful, user }: Props) => {
  return (
    <div title={`Checked on ${checkDate ? localDateTimeWithRelative(checkDate) : 'UNKOWN'}`}>
      <Badge color={harmful ? 'orange' : 'green'}>
        {harmful ? (
          <HandThumbDownIcon className="size-4" />
        ) : (
          <HandThumbUpIcon className="size-4" />
        )}{' '}
        by {user || <i>Unknown user</i>}
      </Badge>
    </div>
  )
}
