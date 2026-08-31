import { useHotkeys } from '@tanstack/react-hotkeys'
import { getRouteApi, useMatch } from '@tanstack/react-router'
import { Footer } from '../components/list/footer.tsx'
import { Header } from '../components/list/header.tsx'
import { List } from '../components/list/list.tsx'
import {
  FILTER_BINDING,
  HELP_BINDING,
  NEXT_CHANGESET,
  PREV_CHANGESET,
  REFRESH_CHANGESETS,
} from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { LIST_REFRESH_HINT_MS } from '../query/cachePolicy.ts'
import { useAOI } from '../query/hooks/useAOI.ts'
import { useChangesetsPage } from '../query/hooks/useChangesetsPage.ts'
import { useStaleAfter } from '../query/hooks/useStaleAfter.ts'
import { searchWithoutMap } from '../routing/mapParam.ts'

const rootRouteApi = getRouteApi('__root__')

function ChangesetsList() {
  const changesetMatch = useMatch({ from: '/changesets/$id', shouldThrow: false })
  const filtersRouteMatch = useMatch({ from: '/filters', shouldThrow: false })
  const aboutRouteMatch = useMatch({ from: '/about', shouldThrow: false })
  const activeChangesetId = changesetMatch?.params.id ?? null
  const navigate = rootRouteApi.useNavigate()
  const search = rootRouteApi.useSearch()
  const { filters, aoiId, page, setFilters, setPage } = useFilters()
  const pageIndex = page - 1
  const { data: aoi } = useAOI(aoiId)
  const orderByFilter = aoi?.properties?.filters?.order_by
  const aoiOrderBy = typeof orderByFilter === 'string' ? orderByFilter : null

  const {
    data: currentPage,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useChangesetsPage({
    pageIndex,
    filters,
    aoiId,
  })
  const listIsStale = useStaleAfter(dataUpdatedAt, LIST_REFRESH_HINT_MS)

  const changesetsPage = currentPage

  function goUpDownToChangeset(direction: number) {
    if (!changesetsPage?.features) return
    const features = changesetsPage.features
    let index = features.findIndex((f: any) => f.id === activeChangesetId)
    index += direction
    const nextFeature = features[index]
    if (nextFeature) {
      void navigate({
        to: '/changesets/$id',
        params: { id: nextFeature.id },
        search: (prev) => searchWithoutMap({ ...prev, ...search }),
      })
    }
  }

  function toggleFilters() {
    if (filtersRouteMatch) {
      void navigate({ to: '/', search })
    } else {
      void navigate({ to: '/filters', search })
    }
  }

  function toggleHelp() {
    if (aboutRouteMatch) {
      void navigate({ to: '/', search })
    } else {
      void navigate({ to: '/about', search })
    }
  }

  const handleFilterOrderBy = (selected: Array<any>) => {
    const newFilters = { ...filters, order_by: selected }
    setFilters(newFilters)
  }

  function reloadChangesetsPageData() {
    void refetch()
  }

  const handleChangePage = (newPageIndex: number) => {
    setPage(newPageIndex + 1)
  }

  useHotkeys([
    ...NEXT_CHANGESET.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => goUpDownToChangeset(1),
    })),
    ...PREV_CHANGESET.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => goUpDownToChangeset(-1),
    })),
    ...FILTER_BINDING.hotkeys.map((hotkey) => ({
      hotkey,
      callback: toggleFilters,
    })),
    ...HELP_BINDING.hotkeys.map((hotkey) => ({
      hotkey,
      callback: toggleHelp,
    })),
    ...REFRESH_CHANGESETS.hotkeys.map((hotkey) => ({
      hotkey,
      callback: reloadChangesetsPageData,
    })),
  ])

  const listLocation = {
    pathname: filtersRouteMatch ? '/filters' : '/',
    search: '',
  }

  return (
    <div className="changesets-list flex h-full min-h-0 flex-col">
      <Header
        filters={filters}
        aoiId={aoiId}
        aoiOrderBy={aoiOrderBy}
        handleFilterOrderBy={handleFilterOrderBy}
        currentPage={changesetsPage}
        pending={isLoading}
        listIsStale={listIsStale}
        isRefreshing={isFetching && !isLoading}
        reloadChangesetsPageData={reloadChangesetsPageData}
      />
      <List
        activeChangesetId={activeChangesetId}
        loading={isLoading}
        currentPage={changesetsPage}
        pageIndex={pageIndex}
        location={listLocation.pathname}
      />
      <Footer
        pageIndex={pageIndex}
        getChangesetsPage={handleChangePage}
        count={isLoading ? undefined : changesetsPage?.count}
      />
    </div>
  )
}

export { ChangesetsList }
