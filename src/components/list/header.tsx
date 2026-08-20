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

  const changesetCount = numberWithCommas(currentPage?.count ?? 0)
  const showFilterBar = signedIn || Boolean(aoiId)

  return (
    <div>
      {showFilterBar ? (
        <div className="relative flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-100 px-2 py-1.5">
          <div className="min-w-0 flex-1">
            <FiltersMenu />
          </div>
          {aoiId ? (
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
          ) : null}
          <DebugDataHelperDialog data={aoi} title="AOI Object" />
        </div>
      ) : null}
      <header
        className={clsx(
          'flex h-11 items-center justify-between gap-2 border-b border-zinc-200 px-1',
          diff > 0 ? 'bg-zinc-200' : 'bg-zinc-50',
        )}
      >
        <span
          aria-label={`${changesetCount} changesets`}
          className="@container min-w-0 flex-1 truncate px-2 text-sm font-semibold text-zinc-600"
        >
          {changesetCount}
          <span className="hidden @[10rem]:inline"> changesets</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            outline
            className={clsx('h-9 min-h-9 items-center', diff <= 0 && 'w-9 min-w-9 px-0 sm:px-0')}
            onClick={reloadChangesetsPageData}
            disabled={!signedIn || diffLoading}
            aria-label="Refresh"
          >
            <ArrowPathIcon data-slot="icon" className={clsx(diffLoading && 'animate-spin')} />
            {diff > 0 ? `${diff} new` : null}
          </Button>
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
        </div>
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
  const iconButtonClassName = 'relative h-9 min-h-9 w-9 min-w-9 px-0 sm:px-0 data-open:z-[110]'
  const ariaLabel = selected ? `Order by: ${orderItemLabel(selected.value)}` : 'Order by'

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
        {groupOrderOptions(options).map((group, index) => {
          const Icon = orderFieldIcon(group.field)
          return (
            <Fragment key={group.field}>
              {index > 0 ? <DropdownDivider /> : null}
              <DropdownSection>
                {group.options.map((option) => (
                  <DropdownItem
                    key={option.value}
                    onClick={() => onChange(option)}
                    className="cursor-pointer"
                  >
                    <Icon data-slot="icon" />
                    <DropdownLabel>{orderItemLabel(option.value)}</DropdownLabel>
                    <CheckIcon
                      className={clsx(
                        'col-start-5 row-start-1 size-4',
                        selected?.value !== option.value && 'invisible',
                      )}
                    />
                  </DropdownItem>
                ))}
              </DropdownSection>
            </Fragment>
          )
        })}
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

const orderFieldHeadings: Record<string, string> = {
  date: 'Date',
  check_date: 'Check date',
  create: 'Objects created',
  modify: 'Objects modified',
  delete: 'Objects deleted',
  comments_count: 'Comments',
}

function orderFieldKey(value: string) {
  return value.startsWith('-') ? value.slice(1) : value
}

function orderFieldIcon(value: string): OrderFieldIcon {
  return orderFieldIcons[orderFieldKey(value)] ?? BarsArrowDownIcon
}

function orderFieldHeading(value: string) {
  const field = orderFieldKey(value)
  return orderFieldHeadings[field] ?? field
}

function orderDirectionLabel(value: string) {
  const newestOrMostFirst = value.startsWith('-')
  const field = orderFieldKey(value)
  if (field === 'date' || field === 'check_date') {
    return newestOrMostFirst ? 'Newest first' : 'Oldest first'
  }
  return newestOrMostFirst ? 'Most first' : 'Fewest first'
}

function orderItemLabel(value: string) {
  return `${orderFieldHeading(value)}: ${orderDirectionLabel(value)}`
}

function groupOrderOptions(options: OrderOption[]) {
  const byValue = new Map(options.map((option) => [option.value, option]))
  const fields: string[] = []

  for (const option of options) {
    const field = orderFieldKey(option.value)
    if (!fields.includes(field)) fields.push(field)
  }

  return fields.flatMap((field) => {
    const groupOptions = [byValue.get(`-${field}`), byValue.get(field)].filter(
      (option): option is OrderOption => option != null,
    )
    if (groupOptions.length === 0) return []
    return [{ field, options: groupOptions }]
  })
}
