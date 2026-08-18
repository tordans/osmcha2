import { ArrowPathIcon } from '@heroicons/react/16/solid'
import { getRouteApi, Link, useMatch } from '@tanstack/react-router'
import clsx from 'clsx'
import filtersConfig from '../../config/filters.json'
import { useAOI } from '../../query/hooks/useAOI.ts'
import numberWithCommas from '../../utils/number_with_commas.ts'
import { DebugDataHelperDialog } from '../debug/DebugDataHelperDialog.tsx'
import { Button } from '../ui/button.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'

const rootRouteApi = getRouteApi('__root__')

type OrderOption = { label: string; value: string }

interface HeaderProps {
  filters: any
  aoiId: string | null
  aoiOrderBy: string | null
  handleFilterOrderBy: (value: OrderOption[]) => void
  diffLoading: boolean
  diff: number
  currentPage?: {
    count?: number
  }
  reloadChangesetsPageData: () => void
}

export function Header({
  filters,
  aoiId,
  aoiOrderBy,
  handleFilterOrderBy,
  diffLoading,
  diff,
  currentPage,
  reloadChangesetsPageData,
}: HeaderProps) {
  const search = rootRouteApi.useSearch()
  const filtersRouteMatch = useMatch({ from: '/filters', shouldThrow: false })
  const { data: aoi } = useAOI(aoiId)
  const aoiName = aoi?.properties?.name as string | undefined
  const orderByFilter = filtersConfig.find((f) => f.name === 'order_by')
  const options = (orderByFilter?.options ?? []) as OrderOption[]
  const effectiveOrderBy = aoiId ? aoiOrderBy : filters?.order_by?.[0]?.value
  const selected = options.find((option) => option.value === effectiveOrderBy) ?? null
  const filtersOpen = Boolean(filtersRouteMatch)
  const filterCount = Object.keys(filters || {}).length

  return (
    <div>
      {aoiId && (
        <div className="relative border-b border-zinc-200 bg-zinc-100 px-3 py-2 font-semibold">
          Saved Filter: {aoiName || aoiId}
          <DebugDataHelperDialog data={aoi} title="AOI Object" />
        </div>
      )}
      <header className="flex min-h-11 items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5">
        <div
          className="max-w-56 min-w-0 flex-1"
          title={aoiId ? 'Sort order is determined by the active saved filter' : undefined}
        >
          <Listbox<OrderOption | null>
            value={selected}
            onChange={(option) => {
              if (option) handleFilterOrderBy([option])
            }}
            disabled={!!aoiId}
            placeholder="Order by"
            aria-label="Order by"
          >
            {options.map((option) => (
              <ListboxOption key={option.value} value={option}>
                <ListboxLabel>{option.label}</ListboxLabel>
              </ListboxOption>
            ))}
          </Listbox>
        </div>
        <Link
          to={filtersOpen ? '/' : '/filters'}
          search={search}
          className={clsx(
            'relative isolate inline-flex min-h-11 shrink-0 cursor-pointer touch-manipulation items-baseline justify-center gap-x-2 rounded-lg border border-zinc-950/10 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] text-sm/6 font-semibold text-zinc-950 select-none',
            'data-hover:bg-zinc-950/2.5',
          )}
        >
          Filters{filterCount > 0 ? ` (${filterCount})` : ''}
        </Link>
      </header>
      <header
        className={clsx(
          'flex items-center justify-between border-b border-zinc-200 px-3 py-1.5',
          diff > 0 ? 'bg-zinc-200' : 'bg-zinc-50',
        )}
      >
        <span className="text-sm font-semibold text-zinc-600">
          {numberWithCommas(currentPage?.count ?? 0)} changesets.
        </span>
        <Button
          outline
          className="min-h-11"
          onClick={reloadChangesetsPageData}
          disabled={diffLoading}
          aria-label="Refresh"
        >
          <ArrowPathIcon data-slot="icon" className={clsx(diffLoading && 'animate-spin')} />
          {diff > 0 ? `${diff} new` : null}
        </Button>
      </header>
    </div>
  )
}
