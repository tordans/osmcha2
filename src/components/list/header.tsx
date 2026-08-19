import {
  ArrowPathIcon,
  BarsArrowDownIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'
import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { Fragment, type ComponentType, type SVGProps } from 'react'
import filtersConfig from '../../config/filters.json'
import { useAuth } from '../../hooks/useAuth.ts'
import { useAOI } from '../../query/hooks/useAOI.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import numberWithCommas from '../../utils/number_with_commas.ts'
import { DebugDataHelperDialog } from '../debug/DebugDataHelperDialog.tsx'
import { Button } from '../ui/button.tsx'
import {
  chromeDropdownMenuClassName,
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '../ui/dropdown.tsx'
import { FiltersMenu } from './FiltersMenu.tsx'

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
  const { token } = useAuth()
  const signedIn = Boolean(token)
  const search = rootRouteApi.useSearch()
  const { data: aoi } = useAOI(aoiId)
  const aoiName = aoi?.properties?.name as string | undefined
  const orderByFilter = filtersConfig.find((f) => f.name === 'order_by')
  const options = (orderByFilter?.options ?? []) as OrderOption[]
  const effectiveOrderBy = aoiId ? aoiOrderBy : filters?.order_by?.[0]?.value
  const selected = options.find((option) => option.value === effectiveOrderBy) ?? null

  return (
    <div>
      {aoiId && (
        <div className="relative flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-100 px-2 py-1.5">
          <p className="min-w-0 truncate px-1 font-semibold">Saved Filter: {aoiName || aoiId}</p>
          <RouterLink
            to="/filters"
            search={{ ...search, aoi: aoiId, filters: undefined, page: undefined }}
            data-panel-origin="filters"
            aria-label={`Edit saved filter ${aoiName || aoiId}`}
            className="relative isolate inline-flex h-8 shrink-0 cursor-pointer touch-manipulation items-center gap-1 rounded-lg px-2 text-sm/6 font-medium text-zinc-600 select-none hover:bg-zinc-950/5 hover:text-zinc-950"
          >
            <PencilSquareIcon className="size-4" />
            Edit
          </RouterLink>
          <DebugDataHelperDialog data={aoi} title="AOI Object" />
        </div>
      )}
      <header className="flex h-11 items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-1">
        {signedIn ? (
          <FiltersMenu />
        ) : (
          <span
            aria-disabled="true"
            title="Sign in to filter changesets"
            data-panel-origin="filters"
            className="relative isolate inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-zinc-950/10 px-[calc(--spacing(3)-1px)] text-sm/6 font-semibold text-zinc-950 opacity-50 select-none"
          >
            Filters
          </span>
        )}
        <OrderMenu
          selected={selected}
          options={options}
          disabled={!signedIn || !!aoiId}
          title={
            !signedIn
              ? 'Sign in to sort the changeset list'
              : aoiId
                ? 'Sort order is determined by the active saved filter'
                : undefined
          }
          onChange={(option) => handleFilterOrderBy([option])}
        />
      </header>
      <header
        className={clsx(
          'flex h-11 items-center justify-between gap-2 border-b border-zinc-200 px-1',
          diff > 0 ? 'bg-zinc-200' : 'bg-zinc-50',
        )}
      >
        <span className="px-2 text-sm font-semibold text-zinc-600">
          {numberWithCommas(currentPage?.count ?? 0)} changesets.
        </span>
        <Button
          outline
          className="h-9 min-h-9 items-center"
          onClick={reloadChangesetsPageData}
          disabled={!signedIn || diffLoading}
          aria-label="Refresh"
        >
          <ArrowPathIcon data-slot="icon" className={clsx(diffLoading && 'animate-spin')} />
          {diff > 0 ? `${diff} new` : null}
        </Button>
      </header>
    </div>
  )
}

function OrderMenu({
  selected,
  options,
  disabled,
  title,
  onChange,
}: {
  selected: OrderOption | null
  options: OrderOption[]
  disabled: boolean
  title?: string
  onChange: (option: OrderOption) => void
}) {
  const iconButtonClassName = 'relative z-[110] h-9 min-h-9 w-9 min-w-9 px-0 sm:px-0'
  const ariaLabel = selected ? `Order by: ${selected.label}` : 'Order by'

  if (disabled) {
    return (
      <span title={title} className="shrink-0">
        <Button outline disabled aria-label={ariaLabel} className={iconButtonClassName}>
          <BarsArrowDownIcon data-slot="icon" />
        </Button>
      </span>
    )
  }

  return (
    <Dropdown backdrop className="shrink-0">
      <DropdownButton outline aria-label={ariaLabel} className={iconButtonClassName}>
        <BarsArrowDownIcon data-slot="icon" />
      </DropdownButton>
      <DropdownMenu anchor="bottom end" className={chromeDropdownMenuClassName}>
        {groupOrderOptions(options).map((group, index) => (
          <Fragment key={group.heading}>
            {index > 0 ? <DropdownDivider /> : null}
            <DropdownSection>
              <DropdownHeading>{group.heading}</DropdownHeading>
              {group.options.map((option) => {
                const Icon = orderFieldIcon(option.value)
                return (
                  <DropdownItem
                    key={option.value}
                    onClick={() => onChange(option)}
                    className="cursor-pointer"
                  >
                    <Icon data-slot="icon" />
                    <DropdownLabel>{orderItemLabel(option)}</DropdownLabel>
                    <CheckIcon
                      className={clsx(
                        'col-start-5 row-start-1 size-4',
                        selected?.value !== option.value && 'invisible',
                      )}
                    />
                  </DropdownItem>
                )
              })}
            </DropdownSection>
          </Fragment>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}

type OrderFieldIcon = ComponentType<SVGProps<SVGSVGElement>>

const orderFieldIcons: Record<string, OrderFieldIcon> = {
  date: CalendarDaysIcon,
  check_date: ClipboardDocumentCheckIcon,
  create: PlusIcon,
  modify: PencilSquareIcon,
  delete: TrashIcon,
  comments_count: ChatBubbleLeftIcon,
}

function orderFieldKey(value: string) {
  return value.startsWith('-') ? value.slice(1) : value
}

function orderFieldIcon(value: string): OrderFieldIcon {
  return orderFieldIcons[orderFieldKey(value)] ?? BarsArrowDownIcon
}

function orderItemLabel(option: OrderOption) {
  return option.label
    .replace(/^(Ascending|Descending)\s+/i, '')
    .replace(/^object created$/i, 'Objects created')
    .replace(/^object modified$/i, 'Objects modified')
    .replace(/^object deleted$/i, 'Objects deleted')
    .replace(/^number of comments$/i, 'Comments')
}

function groupOrderOptions(options: OrderOption[]) {
  return [
    { heading: 'Ascending', options: options.filter((option) => !option.value.startsWith('-')) },
    { heading: 'Descending', options: options.filter((option) => option.value.startsWith('-')) },
  ].filter((group) => group.options.length > 0)
}
