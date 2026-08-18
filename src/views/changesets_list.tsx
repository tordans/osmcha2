import { getRouteApi, useMatch } from '@tanstack/react-router'
import Mousetrap from 'mousetrap'
import { useEffect, useEffectEvent } from 'react'
import { Footer } from '../components/list/footer.tsx'
import { Header } from '../components/list/header.tsx'
import { List } from '../components/list/index.tsx'
import {
  FILTER_BINDING,
  HELP_BINDING,
  NEXT_CHANGESET,
  PREV_CHANGESET,
  REFRESH_CHANGESETS,
} from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { useAOI } from '../query/hooks/useAOI.ts'
import { useChangesetsPage } from '../query/hooks/useChangesetsPage.ts'

const rootRouteApi = getRouteApi('__root__')

interface ChangesetsPageData {
  features: Array<{ id: number; properties: any }>
  count: number
  [key: string]: any
}

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
  const aoiOrderBy = aoi?.properties?.filters?.order_by ?? null

  const {
    data: currentPage,
    isLoading,
    refetch,
  } = useChangesetsPage({
    pageIndex,
    filters,
    aoiId,
  })

  const changesetsPage = currentPage as ChangesetsPageData | undefined

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
        search: (_prev) => ({
          ...search,
          map: undefined,
        }),
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

  const onGoUpDownToChangeset = useEffectEvent(goUpDownToChangeset)
  const onToggleFilters = useEffectEvent(toggleFilters)
  const onToggleHelp = useEffectEvent(toggleHelp)
  const onReloadChangesetsPageData = useEffectEvent(reloadChangesetsPageData)

  const handleChangePage = (newPageIndex: number) => {
    setPage(newPageIndex + 1)
  }

  useEffect(function bindChangesetListShortcuts() {
    const shortcuts = [
      {
        bindings: NEXT_CHANGESET.bindings,
        handler: () => onGoUpDownToChangeset(1),
      },
      {
        bindings: PREV_CHANGESET.bindings,
        handler: () => onGoUpDownToChangeset(-1),
      },
      {
        bindings: FILTER_BINDING.bindings,
        handler: onToggleFilters,
      },
      {
        bindings: HELP_BINDING.bindings,
        handler: onToggleHelp,
      },
      {
        bindings: REFRESH_CHANGESETS.bindings,
        handler: onReloadChangesetsPageData,
      },
    ]

    for (const shortcut of shortcuts) {
      Mousetrap.bind(shortcut.bindings, (e) => {
        e.preventDefault()
        shortcut.handler()
      })
    }

    return function unbindChangesetListShortcuts() {
      for (const shortcut of shortcuts) {
        Mousetrap.unbind(shortcut.bindings)
      }
    }
  }, [])

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
        diff={0}
        diffLoading={false}
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
        count={changesetsPage?.count}
      />
    </div>
  )
}

export { ChangesetsList }
