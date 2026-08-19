import {
  ChevronDownIcon,
  ExclamationTriangleIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import { useTrustedlist } from '../../query/hooks/useTrustedlist.ts'
import {
  useAddToTrustedlist,
  useRemoveFromTrustedlist,
} from '../../query/hooks/useTrustedlistMutations.ts'
import { useWatchlist } from '../../query/hooks/useWatchlist.ts'
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from '../../query/hooks/useWatchlistMutations.ts'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../ui/dropdown.tsx'

interface TrustWatchUserProps {
  user: {
    name: string
    uid: number
  }
}

function TrustWatchUser({ user }: TrustWatchUserProps) {
  const { data: trustedlist } = useTrustedlist()
  const { data: watchlist = [] } = useWatchlist()
  const addToTrustedlistMutation = useAddToTrustedlist()
  const removeFromTrustedlistMutation = useRemoveFromTrustedlist()
  const addToWatchlistMutation = useAddToWatchlist()
  const removeFromWatchlistMutation = useRemoveFromWatchlist()

  const username = user.name
  const uid = user.uid

  const isWatchlisted = watchlist.some((u) => u.uid === String(uid))
  const isTrusted = trustedlist.includes(username)

  if (isWatchlisted) {
    return (
      <div className="flex items-center gap-1">
        <Badge color="red">
          <ExclamationTriangleIcon className="size-4" />
          Watchlisted user
        </Badge>
        <Button
          plain
          aria-label="Remove from watchlist"
          onClick={() => removeFromWatchlistMutation.mutate(String(uid))}
          className="min-h-11 min-w-11 cursor-pointer touch-manipulation select-none"
        >
          <XMarkIcon data-slot="icon" className="size-4" />
        </Button>
      </div>
    )
  }

  if (isTrusted) {
    return (
      <div className="flex items-center gap-1">
        <Badge color="yellow">
          <StarIcon className="size-4" />
          Trusted user
        </Badge>
        <Button
          plain
          aria-label="Remove from trusted users"
          onClick={() => removeFromTrustedlistMutation.mutate(username)}
          className="min-h-11 min-w-11 cursor-pointer touch-manipulation select-none"
        >
          <XMarkIcon data-slot="icon" className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <Dropdown>
      <DropdownButton outline className="min-h-11 cursor-pointer touch-manipulation select-none">
        Trust / Watch user
        <ChevronDownIcon data-slot="icon" />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => addToWatchlistMutation.mutate({ username, uid: String(uid) })}>
          Add to your watchlist
        </DropdownItem>
        <DropdownItem onClick={() => addToTrustedlistMutation.mutate(username)}>
          Add to your trusted users list
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export { TrustWatchUser }
