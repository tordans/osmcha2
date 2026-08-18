import { ExclamationTriangleIcon, StarIcon } from '@heroicons/react/16/solid'
import { useAuth } from '../../hooks/useAuth.ts'
import { useIsUserListed } from '../../hooks/useIsUserListed.ts'

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
          <StarIcon className="ml-1 inline-block size-4 align-text-bottom text-yellow-500" />
        )}
        {isInWatchlist && (
          <ExclamationTriangleIcon className="ml-1 inline-block size-4 align-text-bottom text-red-500" />
        )}
        :
      </strong>{' '}
      {comment || 'NO COMMENT'}
    </p>
  )
}
