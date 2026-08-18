import { TrashIcon } from '@heroicons/react/16/solid'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
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
import { useTrustedlist } from '../query/hooks/useTrustedlist.ts'
import {
  useAddToTrustedlist,
  useRemoveFromTrustedlist,
} from '../query/hooks/useTrustedlistMutations.ts'

type SortDir = 'asc' | 'desc'

type UserData = {
  avatar?: string
}

export function TrustedUsers() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const { data: trustedList } = useTrustedlist()
  const addMutation = useAddToTrustedlist()
  const removeMutation = useRemoveFromTrustedlist()
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const addToTrustedList = ({ username }: { username: string }) => {
    if (!username) return
    addMutation.mutate(username)
  }

  const removeFromTrustedList = (username: string) => {
    if (!username) return
    removeMutation.mutate(username)
  }

  const sorted = [...trustedList].sort((a, b) => {
    const cmp = a.localeCompare(b)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <AccountPage>
      <SecondaryPagesHeader title="Trusted Users" avatar={currentUser?.avatar} />
      {token ? (
        <div className="flex flex-col gap-6">
          <Text>
            {trustedList.length} {trustedList.length === 1 ? 'trusted user' : 'trusted users'}
          </Text>
          <Table striped>
            <TableHead>
              <TableRow>
                <SortHeader
                  label="Username"
                  sortKey="username"
                  active="username"
                  dir={sortDir}
                  onSort={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                />
                <TableHeader>
                  <span className="sr-only">Actions</span>
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((username) => (
                <TableRow key={username}>
                  <TableCell className="font-medium">{username}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        to="/"
                        search={{
                          filters: {
                            users: [{ label: username, value: username }],
                          },
                        }}
                        className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center rounded-lg px-3 text-sm font-semibold text-zinc-950 select-none hover:bg-zinc-950/5"
                      >
                        Changesets
                      </Link>
                      <Button
                        plain
                        type="button"
                        className="min-h-11"
                        title="Remove from trusted users"
                        onClick={() => removeFromTrustedList(username)}
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

          <SaveUser onCreate={addToTrustedList} />
        </div>
      ) : null}
    </AccountPage>
  )
}
