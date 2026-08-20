import { TrashIcon } from '@heroicons/react/16/solid'
import {
  createColumnHelper,
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
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
import { listSearchFromFilters } from '../routing/filterSearch.ts'
import { RouterLink } from '../routing/RouterLink.tsx'

type TrustedUserRow = {
  username: string
}

type UserData = {
  avatar?: string
}

const EMPTY_TRUSTED: TrustedUserRow[] = []

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})

const columnHelper = createColumnHelper<typeof features, TrustedUserRow>()

export function TrustedUsers() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const { data: trustedList } = useTrustedlist()
  const addMutation = useAddToTrustedlist()
  const removeMutation = useRemoveFromTrustedlist()

  const addToTrustedList = ({ username }: { username: string }) => {
    if (!username) return
    addMutation.mutate(username)
  }

  const removeFromTrustedList = (username: string) => {
    if (!username) return
    removeMutation.mutate(username)
  }

  const data =
    trustedList.length === 0 ? EMPTY_TRUSTED : trustedList.map((username) => ({ username }))

  const columns = columnHelper.columns([
    columnHelper.accessor('username', {
      sortFn: (rowA, rowB) => rowA.original.username.localeCompare(rowB.original.username),
    }),
    columnHelper.display({
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        const username = row.original.username
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <RouterLink
              to="/"
              search={listSearchFromFilters({
                users: [{ label: username, value: username }],
              })}
              className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center rounded-lg px-3 text-sm font-semibold text-zinc-950 select-none hover:bg-zinc-950/5"
            >
              Changesets
            </RouterLink>
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
        )
      },
    }),
  ])

  const table = useTable({
    features,
    data,
    columns,
    initialState: {
      sorting: [{ id: 'username', desc: false }],
    },
    enableSortingRemoval: false,
    getRowId: (row) => row.username,
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
                  sorted={table.getColumn('username')?.getIsSorted() ?? false}
                  onSort={() => table.getColumn('username')?.toggleSorting()}
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

          <SaveUser onCreate={addToTrustedList} />
        </div>
      ) : null}
    </AccountPage>
  )
}
