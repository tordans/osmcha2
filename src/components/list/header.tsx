import { ArrowPathIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import filtersConfig from '../../config/filters.json'
import { useAOI } from '../../query/hooks/useAOI.ts'
import numberWithCommas from '../../utils/number_with_commas.ts'
import { DebugDataHelperDialog } from '../debug/DebugDataHelperDialog.tsx'
import { Button } from '../ui/button.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'

type OrderOption = { label: string; value: string }

interface HeaderProps {
  filters: any
  aoiId: string | null
  aoiOrderBy: string | null
  handleFilterOrderBy: (value: OrderOption[]) => void
  location: {
    search: string
    pathname: string
  }
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
  location,
  diffLoading,
  diff,
  currentPage,
  reloadChangesetsPageData,
}: HeaderProps) {
  const { data: aoi } = useAOI(aoiId)
  const aoiName = aoi?.properties?.name as string | undefined
  const orderByFilter = filtersConfig.find((f) => f.name === 'order_by')
  const options = (orderByFilter?.options ?? []) as OrderOption[]
  const effectiveOrderBy = aoiId ? aoiOrderBy : filters?.order_by?.[0]?.value
  const selected = options.find((option) => option.value === effectiveOrderBy) ?? null
  const filtersOpen = location.pathname.includes('/filters')
  const filterCount = Object.keys(filters || {}).length
  const filtersHref = `${filtersOpen ? '/' : '/filters'}${location.search}`

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
        <Button outline href={filtersHref} className="min-h-11 shrink-0">
          Filters{filterCount > 0 ? ` (${filterCount})` : ''}
        </Button>
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
