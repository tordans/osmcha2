import { getRouteApi } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EMPTY_FILTERS, type OsmchaSearch } from '../routing/searchSchemas.ts'
import { validateFilters } from '../utils/filters.ts'

const rootRouteApi = getRouteApi('__root__')

type NavigateOptions = {
  replace?: boolean
}

export function useFilters() {
  const { filters, aoi, page } = rootRouteApi.useSearch()
  const navigate = rootRouteApi.useNavigate()

  const updateSearch = (
    partial: Partial<OsmchaSearch> | ((prev: OsmchaSearch) => Partial<OsmchaSearch>),
    options?: NavigateOptions,
  ) => {
    void navigate({
      search: (prev) => {
        const updates = typeof partial === 'function' ? partial(prev) : partial
        const next: Record<string, unknown> = { ...prev }

        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined) {
            delete next[key]
          } else {
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
        const filtersString = JSON.stringify(newFilters)
        if (filtersString.length > 7000) {
          toast.error('Filter too large', {
            description: 'Your filter is too big. Please save it as an AOI instead.',
          })
          return
        }
      }

      updateSearch((prev) => ({
        filters: hasFilters ? newFilters : undefined,
        page: 1,
        aoi: hasFilters ? prev.aoi : undefined,
      }))
    } catch (error) {
      console.error('Failed to set filters:', error)
      toast.error('Invalid filters', {
        description: error instanceof Error ? error.message : 'Failed to apply filters',
      })
      updateSearch({
        filters: undefined,
        aoi: undefined,
        page: undefined,
      })
    }
  }

  function setAoiId(nextAoiId: string | null) {
    updateSearch({
      aoi: nextAoiId ?? undefined,
      filters: undefined,
      page: 1,
    })
  }

  function clearFilters() {
    updateSearch({
      filters: undefined,
      aoi: undefined,
      page: undefined,
    })
  }

  function setPage(nextPage: number) {
    updateSearch({ page: nextPage <= 1 ? undefined : nextPage })
  }

  return {
    filters: filters ?? EMPTY_FILTERS,
    aoiId: aoi ?? null,
    page,
    setFilters,
    setAoiId,
    clearFilters,
    setPage,
    updateSearch,
  }
}
