import { TrustedListUser } from './trustedlist_user.tsx'
import { WatchListUser } from './watchlist_user.tsx'

type SaveUserProps = {
  forWatchlist?: boolean
  onCreate: (data: { username: string; uid?: string }) => void
}

export function SaveUser({ forWatchlist, onCreate }: SaveUserProps) {
  const onSave = (username: string, uid?: number | string) => {
    if (forWatchlist) {
      if (!username || !uid) return
      onCreate({ username, uid: String(uid) })
      return
    }
    if (!username) return
    onCreate({ username })
  }

  return forWatchlist ? <WatchListUser onSave={onSave} /> : <TrustedListUser onSave={onSave} />
}
