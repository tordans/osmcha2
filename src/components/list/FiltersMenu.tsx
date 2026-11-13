import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useMatch, useRouter } from '@tanstack/react-router'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { changesetsPageQueryOptions } from '../../query/options/changesetsPage.ts'
import { filtersFromSearch, stripFilterSearch, withFilters } from '../../routing/filterSearch.ts'
import type { OsmchaSearch } from '../../routing/searchSchemas.ts'
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
import { filterName, useSelectedList } from './useSelectedList.ts'

const rootRouteApi = getRouteApi('__root__')

export function FiltersMenu({ pending = false }: { pending?: boolean }) {
  const { token, user } = useAuth()
  const signedIn = Boolean(token)
  const username = user?.username
  const uid = user?.uid
  const search = rootRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const openChangesetId = useMatch({ from: '/changesets/$id', shouldThrow: false })?.params.id
  const {
    aoiId,
    aois,
    selected,
    selectedName,
    isMyChangesets,
    isMyReviews,
    isRecent,
    label: triggerLabel,
  } = useSelectedList()

  const savedAois =
    aoiId && !selected
      ? [{ id: aoiId, properties: { name: selectedName || undefined } }, ...aois]
      : aois

  const goToList = (nextSearch: OsmchaSearch) =>
    navigate({ to: '/', search: nextSearch, replace: true })

  // The open changeset stays open when the first page of the new list contains it.
  const switchList = async (nextSearch: OsmchaSearch) => {
    if (openChangesetId == null) {
      void goToList(nextSearch)
      return
    }

    await navigate({
      to: '/changesets/$id',
      params: { id: openChangesetId },
      search: nextSearch,
      replace: true,
    })
    const stayedAt = router.state.location.href
    const firstPage = await queryClient
      .fetchQuery(
        changesetsPageQueryOptions({
          pageIndex: 0,
          filters: filtersFromSearch(nextSearch),
          aoiId: nextSearch.aoi ?? null,
        }),
      )
      .catch(() => null)
    // Unknown when the list failed to load: stay.
    if (!firstPage) return
    const inList = firstPage.features?.some((feature) => feature.id === openChangesetId)

    // The user may have moved on while the list loaded.
    if (!inList && router.state.location.href === stayedAt) void goToList(nextSearch)
  }

  const goRecent = () => {
    void switchList(stripFilterSearch({ ...search, aoi: undefined, page: undefined }))
  }

  const goMyChangesets = () => {
    if (uid == null) return
    void switchList(
      withFilters(
        { ...search, aoi: undefined, page: undefined },
        {
          uids: [{ label: String(uid), value: String(uid) }],
          date__gte: [{ label: '', value: '' }],
        },
      ),
    )
  }

  const goMyReviews = () => {
    if (!username) return
    void switchList(
      withFilters(
        { ...search, aoi: undefined, page: undefined },
        {
          checked_by: [{ label: username, value: username }],
          date__gte: [{ label: '', value: '' }],
        },
      ),
    )
  }

  const goNew = () => {
    void navigate({
      to: '/filters',
      search: stripFilterSearch({ ...search, aoi: undefined, page: undefined }),
      replace: true,
    })
  }

  const goSelect = (id: string) => {
    void switchList(stripFilterSearch({ ...search, aoi: id, page: undefined }))
  }

  return (
    <Dropdown backdrop className="min-w-0 flex-1">
      <DropdownButton
        outline
        data-panel-origin="filters"
        aria-busy={pending}
        aria-label={pending ? `${triggerLabel}, loading` : triggerLabel}
        title={triggerLabel}
        className="group relative h-11 min-h-11 w-full min-w-0 justify-start data-open:z-[110] sm:h-9 sm:min-h-9"
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
