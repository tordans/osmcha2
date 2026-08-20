import { CheckIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/16/solid'
import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { useFilters } from '../../hooks/useFilters.ts'
import { useAOI, useAllAOIs } from '../../query/hooks/useAOI.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import {
  chromeDropdownMenuClassName,
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '../ui/dropdown.tsx'

const rootRouteApi = getRouteApi('__root__')

const compactActionClassName = clsx(
  'relative isolate inline-flex h-8 shrink-0 cursor-pointer touch-manipulation items-center gap-1 rounded-lg px-2 text-sm/6 font-semibold text-zinc-950 select-none',
  'hover:bg-zinc-950/5',
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

function FilterLabel({ children }: { children: string }) {
  return (
    <p className="min-w-0 truncate px-1 font-semibold" title={children}>
      {children}
    </p>
  )
}

export function FiltersMenu() {
  const { token } = useAuth()
  const signedIn = Boolean(token)
  const search = rootRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()
  const { aoiId } = useFilters()
  const { data: aoi } = useAOI(aoiId)
  const { data, isPending } = useAllAOIs()
  const aois = aoiList(data)
  const selected = aois.find((item) => String(item.id) === aoiId)
  const selectedName = selected
    ? filterName(selected)
    : ((aoi?.properties?.name as string | undefined) ?? aoiId)
  const triggerLabel = aoiId && selectedName ? `Filter: ${selectedName}` : 'Select filter'

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

  if (signedIn && aois.length > 0) {
    return (
      <Dropdown backdrop className="min-w-0 flex-1">
        <DropdownButton
          outline
          data-panel-origin="filters"
          aria-label={triggerLabel}
          title={triggerLabel}
          className="group relative h-9 min-h-9 w-full min-w-0 justify-start data-open:z-[110]"
        >
          <span className="min-w-0 truncate">{triggerLabel}</span>
          <ChevronDownIcon
            data-slot="icon"
            className="shrink-0 transition duration-200 group-data-open:rotate-180"
          />
        </DropdownButton>
        <DropdownMenu anchor="bottom start" className={chromeDropdownMenuClassName}>
          <DropdownItem onClick={goNew} className="cursor-pointer">
            <PlusIcon data-slot="icon" />
            <DropdownLabel>New filter</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          {aois.map((item) => {
            const id = String(item.id)
            const name = filterName(item)
            const current = aoiId === id

            return (
              <DropdownItem key={id} onClick={() => goSelect(id)} className="cursor-pointer">
                <CheckIcon data-slot="icon" className={clsx(!current && 'invisible')} />
                <DropdownLabel>{name}</DropdownLabel>
              </DropdownItem>
            )
          })}
        </DropdownMenu>
      </Dropdown>
    )
  }

  if (aoiId && selectedName) {
    return <FilterLabel>{`Filter: ${selectedName}`}</FilterLabel>
  }

  if (!signedIn) return null

  if (isPending) {
    return <FilterLabel>Select filter</FilterLabel>
  }

  return (
    <RouterLink
      to="/filters"
      search={{ ...search, aoi: undefined, filters: undefined, page: undefined }}
      data-panel-origin="filters"
      className={compactActionClassName}
    >
      <PlusIcon className="size-4" />
      Create Filter
    </RouterLink>
  )
}
