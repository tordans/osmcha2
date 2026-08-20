import { useAuth } from '../../hooks/useAuth.ts'
import { useIsUserListed } from '../../hooks/useIsUserListed.ts'
import { ExclamationTriangleIcon, StarIcon } from '../ui/icons.ts'

interface PrimaryLineProps {
  user?: string
  uid?: number | string
  comment?: string | null
}

export function PrimaryLine({ user, uid, comment }: PrimaryLineProps) {
  const { token } = useAuth()
  const [isInTrustedlist, isInWatchlist] = useIsUserListed(user ?? '', Number(uid) || 0, token)

  return (
    <p className="w-full leading-tight hyphens-auto" lang="en">
      <strong className="font-semibold">
        {user || <i>OSM User</i>}
        {isInTrustedlist && (
          <StarIcon
            variant="fill"
            className="ml-1 inline-block size-4 align-text-bottom text-yellow-500"
          />
        )}
        {isInWatchlist && (
          <ExclamationTriangleIcon
            variant="fill"
            className="ml-1 inline-block size-4 align-text-bottom text-red-500"
          />
        )}
        :
      </strong>{' '}
      {comment || 'NO COMMENT'}
    </p>
  )
}
