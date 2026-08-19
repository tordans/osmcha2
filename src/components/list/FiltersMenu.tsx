import * as Headless from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/16/solid'
import { getRouteApi, useMatch } from '@tanstack/react-router'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useFilters } from '../../hooks/useFilters.ts'
import { useAllAOIs } from '../../query/hooks/useAOI.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import {
  chromeDropdownMenuClassName,
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownMenu,
} from '../ui/dropdown.tsx'

const rootRouteApi = getRouteApi('__root__')

const filtersButtonClassName = clsx(
  'relative isolate inline-flex h-9 cursor-pointer touch-manipulation items-center justify-center rounded-lg border border-zinc-950/10 px-[calc(--spacing(3)-1px)] text-sm/6 font-semibold text-zinc-950 select-none',
  'data-hover:bg-zinc-950/2.5',
)

const filterMenuItemClassName = clsx(
  'flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-base/6 text-zinc-950 select-none sm:min-h-9 sm:text-sm/6',
  'focus:outline-hidden data-focus:bg-blue-500 data-focus:text-white',
)

type AoiFeature = {
  id: string | number
  properties?: { name?: string }
}

function aoiList(data: unknown): AoiFeature[] {
  if (!data) return []
  if (Array.isArray(data)) return data as AoiFeature[]
  if (typeof data === 'object' && data !== null && 'features' in data) {
    const features = (data as { features: unknown }).features
    if (Array.isArray(features)) return features as AoiFeature[]
  }
  return []
}

function filterName(aoi: AoiFeature) {
  return aoi.properties?.name || `Filter ${aoi.id}`
}

export function FiltersMenu() {
  const search = rootRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()
  const filtersOpen = Boolean(useMatch({ from: '/filters', shouldThrow: false }))
  const { aoiId } = useFilters()
  const { data } = useAllAOIs()
  const aois = aoiList(data)

  const goNew = () => {
    void navigate({
      to: '/filters',
      search: { ...search, aoi: undefined, filters: undefined, page: undefined },
    })
  }

  const goSelect = (id: string) => {
    void navigate({
      to: '/',
      search: { ...search, aoi: id, filters: undefined, page: undefined },
    })
  }

  const goEdit = (id: string) => {
    void navigate({
      to: '/filters',
      search: { ...search, aoi: id, filters: undefined, page: undefined },
    })
  }

  if (aois.length === 0) {
    return (
      <motion.div whileTap={{ scale: 0.97 }} className="shrink-0">
        <RouterLink
          to={filtersOpen ? '/' : '/filters'}
          search={search}
          data-panel-origin="filters"
          className={filtersButtonClassName}
        >
          Filters
        </RouterLink>
      </motion.div>
    )
  }

  return (
    <Dropdown backdrop className="shrink-0">
      <DropdownButton
        outline
        data-panel-origin="filters"
        className="group relative z-[110] h-9 min-h-9"
      >
        Filters
        <ChevronDownIcon
          data-slot="icon"
          className="transition duration-200 group-data-open:rotate-180"
        />
      </DropdownButton>
      <DropdownMenu anchor="bottom start" className={chromeDropdownMenuClassName}>
        <Headless.MenuItem>
          <button type="button" onClick={goNew} className={filterMenuItemClassName}>
            <PlusIcon className="size-4 shrink-0" />
            New filter
          </button>
        </Headless.MenuItem>
        <DropdownDivider />
        {aois.map((aoi) => {
          const id = String(aoi.id)
          const name = filterName(aoi)
          const current = aoiId === id

          return (
            <div key={id} className="flex min-w-0 items-stretch">
              <Headless.MenuItem>
                <button
                  type="button"
                  onClick={() => goSelect(id)}
                  className={clsx(filterMenuItemClassName, 'rounded-r-none')}
                >
                  <CheckIcon className={clsx('size-4 shrink-0', !current && 'invisible')} />
                  <span className="min-w-0 truncate">{name}</span>
                </button>
              </Headless.MenuItem>
              <Headless.MenuItem>
                <button
                  type="button"
                  aria-label={`Edit ${name}`}
                  onClick={() => goEdit(id)}
                  className={clsx(
                    'relative z-0 -ml-px flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-r-lg border-l border-zinc-950/10 text-zinc-500 sm:size-9',
                    'focus:outline-hidden data-focus:z-10 data-focus:border-blue-500 data-focus:bg-blue-500 data-focus:text-white',
                  )}
                >
                  <PencilSquareIcon className="size-5 sm:size-4" />
                </button>
              </Headless.MenuItem>
            </div>
          )
        })}
      </DropdownMenu>
    </Dropdown>
  )
}
