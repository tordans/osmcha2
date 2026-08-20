import {
  createColumnHelper,
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { RelativeTime } from '../components/relative_time.tsx'
import { AccountPage, SecondaryPagesHeader } from '../components/secondary_pages_header.tsx'
import { SortHeader } from '../components/sort_header.tsx'
import { Button } from '../components/ui/button.tsx'
import { FunnelIcon, TrashIcon } from '../components/ui/icons.ts'
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
import { listSearchFromFilters } from '../routing/filterSearch.ts'
import { RouterLink } from '../routing/RouterLink.tsx'
import { parseOsmDate } from '../utils/datetime.ts'

type WatchlistUser = {
  username: string
  uid: string
  date?: string
}

type UserData = {
  avatar?: string
}

const EMPTY_WATCHLIST: WatchlistUser[] = []

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})

const columnHelper = createColumnHelper<typeof features, WatchlistUser>()

export function Watchlist() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const { data: watchlist = EMPTY_WATCHLIST } = useWatchlist()
  const addMutation = useAddToWatchlist()
  const removeMutation = useRemoveFromWatchlist()

  const addToWatchList = ({ username, uid }: { username: string; uid?: string }) => {
    if (!username || !uid) return
    if (watchlist.some((listed) => listed.uid === uid)) {
      toast.error('Already on watchlist', {
        description: `${username} (${uid})`,
      })
      return
    }
    addMutation.mutate({ username, uid })
  }

  const removeFromWatchList = (uid: string) => {
    if (!uid) return
    removeMutation.mutate(uid)
  }

  const columns = columnHelper.columns([
    columnHelper.accessor('username', {
      sortFn: (rowA, rowB) => rowA.original.username.localeCompare(rowB.original.username),
    }),
    columnHelper.accessor('uid', {
      sortFn: (rowA, rowB) => Number(rowA.original.uid) - Number(rowB.original.uid),
    }),
    columnHelper.accessor((row) => row.date ?? '', {
      id: 'date',
      sortDescFirst: true,
      sortFn: (rowA, rowB, columnId) =>
        String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId))),
      cell: ({ row }) => {
        const date = row.original.date
        return date ? <RelativeTime datetime={parseOsmDate(date)} /> : '—'
      },
    }),
    columnHelper.display({
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        const listed = row.original
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <RouterLink
              to="/"
              search={listSearchFromFilters({
                users: [{ label: listed.username, value: listed.username }],
              })}
              className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center rounded-lg px-3 text-sm font-semibold text-zinc-950 select-none hover:bg-zinc-950/5"
            >
              Changesets
            </RouterLink>
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
        )
      },
    }),
  ])

  const table = useTable({
    features,
    data: watchlist,
    columns,
    initialState: {
      sorting: [{ id: 'date', desc: true }],
    },
    enableSortingRemoval: false,
    getRowId: (row) => row.uid,
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
                  sorted={table.getColumn('username')?.getIsSorted() ?? false}
                  onSort={() => table.getColumn('username')?.toggleSorting()}
                />
                <SortHeader
                  label="ID"
                  sorted={table.getColumn('uid')?.getIsSorted() ?? false}
                  onSort={() => table.getColumn('uid')?.toggleSorting()}
                />
                <SortHeader
                  label="Added"
                  sorted={table.getColumn('date')?.getIsSorted() ?? false}
                  onSort={() => table.getColumn('date')?.toggleSorting()}
                />
                <TableHeader>
                  <span className="sr-only">Actions</span>
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === 'username' ? 'font-medium' : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <SaveUser onCreate={addToWatchList} forWatchlist={true} />

          <div>
            <RouterLink
              to="/"
              search={listSearchFromFilters({
                blacklist: [{ label: 'Yes', value: 'True' }],
              })}
              className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-lg border border-zinc-950/10 px-3 text-sm font-semibold text-zinc-950 select-none hover:bg-zinc-950/2.5"
            >
              <FunnelIcon className="size-4" />
              View changesets from users on your watchlist
            </RouterLink>
          </div>
        </div>
      ) : null}
    </AccountPage>
  )
}
