import { FunnelIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { toast } from 'sonner'
import { RelativeTime } from '../components/relative_time.tsx'
import { AccountPage, SecondaryPagesHeader } from '../components/secondary_pages_header.tsx'
import { SortHeader } from '../components/sort_header.tsx'
import { Button } from '../components/ui/button.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.tsx'
import { Text } from '../components/ui/text.tsx'
import { SaveUser } from '../components/user/save_user.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useWatchlist } from '../query/hooks/useWatchlist.ts'
import { useAddToWatchlist, useRemoveFromWatchlist } from '../query/hooks/useWatchlistMutations.ts'
import { getObjAsQueryParam } from '../utils/query_params.ts'

type WatchlistUser = {
  username: string
  uid: string
  date?: string
}

type SortKey = 'username' | 'uid' | 'date'
type SortDir = 'asc' | 'desc'

function compareUsers(a: WatchlistUser, b: WatchlistUser, key: SortKey): number {
  if (key === 'uid') return Number(a.uid) - Number(b.uid)
  if (key === 'date') return (a.date || '').localeCompare(b.date || '')
  return a.username.localeCompare(b.username)
}

type UserData = {
  avatar?: string
}

export function Watchlist() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const { data: watchlist = [] } = useWatchlist()
  const addMutation = useAddToWatchlist()
  const removeMutation = useRemoveFromWatchlist()
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const addToWatchList = ({ username, uid }: { username: string; uid?: string }) => {
    if (!username || !uid) return
    if (watchlist.some((listed) => listed.uid === uid)) {
      toast.error('Already on watchlist', {
        description: `User ${username} (${uid}) is already on your watchlist.`,
      })
      return
    }
    addMutation.mutate({ username, uid })
  }

  const removeFromWatchList = (uid: string) => {
    if (!uid) return
    removeMutation.mutate(uid)
  }

  const sorted = [...watchlist].sort((a, b) => {
    const cmp = compareUsers(a, b, sortKey)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <AccountPage>
      <SecondaryPagesHeader title="Watchlist" avatar={currentUser?.avatar} />
      {token ? (
        <div className="flex flex-col gap-6">
          <Text>
            {watchlist.length} {watchlist.length === 1 ? 'user' : 'users'} on your watchlist
          </Text>
          <Table striped>
            <TableHead>
              <TableRow>
                <SortHeader
                  label="Username"
                  sortKey="username"
                  active={sortKey}
                  dir={sortDir}
                  onSort={onSort}
                />
                <SortHeader
                  label="ID"
                  sortKey="uid"
                  active={sortKey}
                  dir={sortDir}
                  onSort={onSort}
                />
                <SortHeader
                  label="Added"
                  sortKey="date"
                  active={sortKey}
                  dir={sortDir}
                  onSort={onSort}
                />
                <TableHeader>
                  <span className="sr-only">Actions</span>
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((listed) => (
                <TableRow key={listed.uid}>
                  <TableCell className="font-medium">{listed.username}</TableCell>
                  <TableCell>{listed.uid}</TableCell>
                  <TableCell>
                    {listed.date ? <RelativeTime datetime={new Date(listed.date)} /> : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        plain
                        href={`?${getObjAsQueryParam('filters', {
                          users: [{ label: listed.username, value: listed.username }],
                        })}`}
                        className="min-h-11"
                      >
                        Changesets
                      </Button>
                      <Button
                        plain
                        type="button"
                        className="min-h-11"
                        title="Remove from watchlist"
                        onClick={() => removeFromWatchList(listed.uid)}
                      >
                        <TrashIcon data-slot="icon" />
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <SaveUser onCreate={addToWatchList} forWatchlist={true} />

          <div>
            <Button
              outline
              href={`?${getObjAsQueryParam('filters', {
                blacklist: [{ label: 'Yes', value: 'True' }],
              })}`}
              className="min-h-11"
            >
              <FunnelIcon data-slot="icon" />
              View changesets from users on your watchlist
            </Button>
          </div>
        </div>
      ) : null}
    </AccountPage>
  )
}
