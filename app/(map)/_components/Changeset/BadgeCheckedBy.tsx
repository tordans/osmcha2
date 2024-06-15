import { Badge } from '@app/_components/core/badge'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import { localDateTimeWithRelative } from '../utils/localDateTime'

type Props = {
  checkDate: Date | null
  harmful: null | false | true
  user: null | string
  resolved: boolean
}

export const BadgeCheckedBy = ({ checkDate, harmful, user, resolved }: Props) => {
  return (
    <div title={`Checked on ${checkDate ? localDateTimeWithRelative(checkDate) : 'UNKOWN'}`}>
      <Badge color={resolved ? 'green' : harmful ? 'orange' : 'green'}>
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
