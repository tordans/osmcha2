import * as Headless from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/16/solid'
import { getRouteApi, useMatch } from '@tanstack/react-router'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useFilters } from '../../hooks/useFilters.ts'
import { useAllAOIs } from '../../query/hooks/useAOI.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '../ui/dropdown.tsx'

const rootRouteApi = getRouteApi('__root__')

const filtersButtonClassName = clsx(
  'relative isolate inline-flex h-9 cursor-pointer touch-manipulation items-center justify-center rounded-lg border border-zinc-950/10 px-[calc(--spacing(3)-1px)] text-sm/6 font-semibold text-zinc-950 select-none',
  'data-hover:bg-zinc-950/2.5',
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
    <Dropdown className="shrink-0">
      <DropdownButton outline data-panel-origin="filters" className="h-9 min-h-9">
        Filters
        <ChevronDownIcon data-slot="icon" />
      </DropdownButton>
      <DropdownMenu anchor="bottom end" className="max-w-72 min-w-56">
        <DropdownItem onClick={goNew}>
          <PlusIcon data-slot="icon" />
          <DropdownLabel>New filter</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        {aois.map((aoi) => {
          const id = String(aoi.id)
          const name = filterName(aoi)
          const current = aoiId === id

          return (
            <div key={id} className="isolate col-span-full flex min-w-0 items-stretch">
              <DropdownItem
                onClick={() => goSelect(id)}
                className="relative min-w-0 flex-1 rounded-r-none"
              >
                <CheckIcon data-slot="icon" className={current ? undefined : 'invisible'} />
                <DropdownLabel className="truncate">{name}</DropdownLabel>
              </DropdownItem>
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
