import { getRouteApi } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Filters } from '../components/filters/index.ts'
import {
  filtersFromSearch,
  serializeFiltersToSearch,
  stripFilterSearch,
  withFilters,
} from '../routing/filterSearch.ts'
import { EMPTY_FILTERS, type OsmchaSearch } from '../routing/searchSchemas.ts'
import { validateFilters } from '../utils/filters.ts'

const rootRouteApi = getRouteApi('__root__')

type NavigateOptions = {
  replace?: boolean
}

export function useFilters() {
  const search = rootRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()
  const filters = filtersFromSearch(search)

  const updateSearch = (
    partial: Partial<OsmchaSearch> | ((prev: OsmchaSearch) => Partial<OsmchaSearch>),
    options?: NavigateOptions,
  ) => {
    void navigate({
      search: (prev) => {
        const candidate = typeof partial === 'function' ? partial(prev) : { ...prev, ...partial }
        const next: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(candidate)) {
          if (value !== undefined) {
            next[key] = value
          }
        }

        return next as OsmchaSearch
      },
      replace: options?.replace ?? true,
    })
  }

  function setFilters(newFilters: Record<string, unknown>) {
    try {
      validateFilters(newFilters)

      const hasFilters = newFilters && Object.keys(newFilters).length > 0
      if (hasFilters) {
        const filtersString = JSON.stringify(serializeFiltersToSearch(newFilters as Filters))
        if (filtersString.length > 7000) {
          toast.error('Filter too large', {
            description: 'Save it as an AOI instead',
          })
          return
        }
      }

      updateSearch((prev) => ({
        ...withFilters(prev, hasFilters ? (newFilters as Filters) : undefined),
        page: 1,
        aoi: hasFilters ? prev.aoi : undefined,
      }))
    } catch (error) {
      console.error('Failed to set filters:', error)
      toast.error('Invalid filters', {
        description: error instanceof Error ? error.message : 'Failed to apply filters',
      })
      updateSearch((prev) => ({
        ...stripFilterSearch(prev),
        aoi: undefined,
        page: undefined,
      }))
    }
  }

  function setAoiId(nextAoiId: string | null) {
    updateSearch((prev) => ({
      ...stripFilterSearch(prev),
      aoi: nextAoiId ?? undefined,
      page: 1,
    }))
  }

  function clearFilters() {
    updateSearch((prev) => ({
      ...stripFilterSearch(prev),
      aoi: undefined,
      page: undefined,
    }))
  }

  function setPage(nextPage: number) {
    updateSearch({ page: nextPage <= 1 ? undefined : nextPage })
  }

  return {
    filters: Object.keys(filters).length > 0 ? filters : EMPTY_FILTERS,
    aoiId: search.aoi ?? null,
    page: search.page,
    setFilters,
    setAoiId,
    clearFilters,
    setPage,
    updateSearch,
  }
}
