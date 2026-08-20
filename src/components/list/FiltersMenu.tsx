import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { useFilters } from '../../hooks/useFilters.ts'
import { useAOI, useAllAOIs } from '../../query/hooks/useAOI.ts'
import { stripFilterSearch, withFilters } from '../../routing/filterSearch.ts'
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
import { CheckIcon, ChevronDownIcon, LoaderCircleIcon, PlusIcon } from '../ui/icons.ts'

const rootRouteApi = getRouteApi('__root__')

type UserData = {
  username?: string
  uid?: string | number
}

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

function filterValue(filters: Record<string, unknown>, key: string) {
  const items = filters[key]
  if (!Array.isArray(items) || items[0] == null || typeof items[0] !== 'object') return undefined
  if (!('value' in items[0])) return undefined
  return items[0].value
}

function selectedFilterLabel({
  savedName,
  isMyChangesets,
  isMyReviews,
  isRecent,
}: {
  savedName: string | undefined
  isMyChangesets: boolean
  isMyReviews: boolean
  isRecent: boolean
}) {
  if (savedName) return savedName
  if (isMyChangesets) return 'My Changesets'
  if (isMyReviews) return 'My Reviews'
  if (isRecent) return 'Recent'
  return 'Select filter'
}

export function FiltersMenu({ pending = false }: { pending?: boolean }) {
  const { token, user } = useAuth()
  const signedIn = Boolean(token)
  const currentUser = user as UserData | undefined
  const username = currentUser?.username
  const uid = currentUser?.uid
  const search = rootRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()
  const { filters, aoiId } = useFilters()
  const { data: aoi } = useAOI(aoiId)
  const { data } = useAllAOIs()
  const aois = aoiList(data)
  const selected = aois.find((item) => String(item.id) === aoiId)
  const selectedName = selected
    ? filterName(selected)
    : ((aoi?.properties?.name as string | undefined) ?? aoiId)

  const isSaved = Boolean(aoiId)
  const isMyChangesets =
    !isSaved && uid != null && String(filterValue(filters, 'uids')) === String(uid)
  const isMyReviews =
    !isSaved && Boolean(username) && filterValue(filters, 'checked_by') === username
  const isRecent = !isSaved && !filters.uids && !filters.checked_by
  const triggerLabel = selectedFilterLabel({
    savedName: isSaved ? (selectedName ?? undefined) : undefined,
    isMyChangesets,
    isMyReviews,
    isRecent,
  })

  const savedAois =
    aoiId && !selected
      ? [{ id: aoiId, properties: { name: selectedName || undefined } }, ...aois]
      : aois

  const goRecent = () => {
    void navigate({
      to: '/',
      search: stripFilterSearch({ ...search, aoi: undefined, page: undefined }),
    })
  }

  const goMyChangesets = () => {
    if (uid == null) return
    void navigate({
      to: '/',
      search: withFilters(
        { ...search, aoi: undefined, page: undefined },
        {
          uids: [{ label: String(uid), value: String(uid) }],
          date__gte: [{ label: '', value: '' }],
        },
      ),
    })
  }

  const goMyReviews = () => {
    if (!username) return
    void navigate({
      to: '/',
      search: withFilters(
        { ...search, aoi: undefined, page: undefined },
        {
          checked_by: [{ label: username, value: username }],
          date__gte: [{ label: '', value: '' }],
        },
      ),
    })
  }

  const goNew = () => {
    void navigate({
      to: '/filters',
      search: stripFilterSearch({ ...search, aoi: undefined, page: undefined }),
    })
  }

  const goSelect = (id: string) => {
    void navigate({
      to: '/',
      search: stripFilterSearch({ ...search, aoi: id, page: undefined }),
    })
  }

  return (
    <Dropdown backdrop className="min-w-0 flex-1">
      <DropdownButton
        outline
        data-panel-origin="filters"
        aria-busy={pending}
        aria-label={pending ? `${triggerLabel}, loading` : triggerLabel}
        title={triggerLabel}
        className="group relative h-9 min-h-9 w-full min-w-0 justify-start data-open:z-[110]"
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        {pending ? (
          <LoaderCircleIcon data-slot="icon" className="shrink-0 animate-spin" />
        ) : (
          <ChevronDownIcon
            data-slot="icon"
            className="shrink-0 transition duration-200 group-data-open:rotate-180"
          />
        )}
      </DropdownButton>
      <DropdownMenu anchor="bottom start" className={chromeDropdownMenuClassName}>
        <DropdownSection>
          <DropdownHeading>Default</DropdownHeading>
          <FilterItem current={isRecent} onClick={goRecent}>
            Recent
          </FilterItem>
          {signedIn && uid != null && (
            <FilterItem current={isMyChangesets} onClick={goMyChangesets}>
              My Changesets
            </FilterItem>
          )}
          {signedIn && username && (
            <FilterItem current={isMyReviews} onClick={goMyReviews}>
              My Reviews
            </FilterItem>
          )}
        </DropdownSection>
        {savedAois.length > 0 ? (
          <>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>Saved filters</DropdownHeading>
              {savedAois.map((item) => {
                const id = String(item.id)
                const name = filterName(item)
                const current = aoiId === id

                return (
                  <FilterItem key={id} current={current} onClick={() => goSelect(id)}>
                    {name}
                  </FilterItem>
                )
              })}
            </DropdownSection>
          </>
        ) : null}
        {signedIn ? (
          <>
            <DropdownDivider />
            <DropdownItem onClick={goNew} className="cursor-pointer">
              <PlusIcon data-slot="icon" />
              <DropdownLabel>New filter</DropdownLabel>
            </DropdownItem>
          </>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  )
}

function FilterItem({
  current,
  onClick,
  children,
}: {
  current: boolean
  onClick: () => void
  children: string
}) {
  return (
    <DropdownItem onClick={onClick} className="cursor-pointer">
      <CheckIcon data-slot="icon" className={clsx(!current && 'invisible')} />
      <DropdownLabel>{children}</DropdownLabel>
    </DropdownItem>
  )
}
