import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { FiltersHeader } from '../components/filters/filters_header.tsx'
import { FiltersList } from '../components/filters/filters_list.tsx'
import type { Filter, Filters } from '../components/filters/index.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { useAOI } from '../query/hooks/useAOI.ts'
import { useCreateAOI, useDeleteAOI, useUpdateAOI } from '../query/hooks/useAOIMutations.ts'
import { serializeFiltersToSearch, withFilters } from '../routing/filterSearch.ts'
import { applyFilterChange, deserializeFiltersFromObject } from '../utils/filters.ts'

function filtersKey(filters: Filters) {
  return JSON.stringify(serializeFiltersToSearch(filters))
}

const NEW_AOI = 'unnamed *'

const rootRouteApi = getRouteApi('__root__')

export function Filters() {
  const { token } = useAuth()
  const navigate = rootRouteApi.useNavigate()
  const { filters: urlFilters, setAoiId, aoiId, clearFilters } = useFilters()
  const filtersFromUrl = urlFilters as Filters

  const { data: aoi, isLoading: aoiLoading } = useAOI(aoiId)
  const createAOIMutation = useCreateAOI()
  const updateAOIMutation = useUpdateAOI()
  const deleteAOIMutation = useDeleteAOI()

  const [localFilters, setLocalFilters] = useState<Filters>(filtersFromUrl)
  const [prevUrlFiltersKey, setPrevUrlFiltersKey] = useState(() => filtersKey(filtersFromUrl))
  const [appliedAoiId, setAppliedAoiId] = useState<string | number | undefined>(undefined)
  const [active, setActive] = useState('')

  const loading = aoiLoading || createAOIMutation.isPending || updateAOIMutation.isPending
  const hasUrlFilters = Boolean(filtersFromUrl && Object.keys(filtersFromUrl).length > 0)
  const urlFiltersKey = filtersKey(filtersFromUrl)

  if (urlFiltersKey !== prevUrlFiltersKey) {
    setPrevUrlFiltersKey(urlFiltersKey)
    setLocalFilters(filtersFromUrl)
    setAppliedAoiId(undefined)
  } else if (!hasUrlFilters && aoi?.properties?.filters && aoi.id !== appliedAoiId) {
    setAppliedAoiId(aoi.id)
    setLocalFilters(deserializeFiltersFromObject(aoi.properties.filters))
  }

  const handleFocus = (name: string) => {
    setActive(name)
  }

  const handleApply = () => {
    const hasFilters = localFilters && Object.keys(localFilters).length > 0
    void navigate({
      to: '/',
      search: withFilters({ aoi: aoiId ?? undefined }, hasFilters ? localFilters : undefined),
    })
  }

  const handleChange = (name: string, values?: Filter | null) => {
    setLocalFilters((prevFilters) => applyFilterChange(prevFilters, name, values))
  }

  const handleToggleAll = (name: string, values?: Filter | null) => {
    setLocalFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      const isAll = name.slice(0, 4) === 'all_'

      if (isAll) {
        delete newFilters[name.slice(4)]
      } else {
        delete newFilters[`all_${name}`]
      }

      if (!values) {
        delete newFilters[name]
      } else {
        newFilters[name] = values
      }
      return newFilters
    })
  }

  const replaceFiltersState = (next: Filters) => {
    setLocalFilters(next)
  }

  const handleClear = () => {
    clearFilters()
    void navigate({ to: '/' })
  }

  const loadAoiId = (nextAoiId: string) => {
    setAoiId(nextAoiId)
  }

  const getAOIName = () => {
    if (loading) return ''
    return aoi?.properties?.name || NEW_AOI
  }

  const getAOIId = () => {
    if (loading) return ''
    return aoi?.id
  }

  const removeAOI = (aoiIdToRemove: string) => {
    const currentAoiId = getAOIId()
    if (aoiIdToRemove === currentAoiId) {
      handleClear()
    }
    deleteAOIMutation.mutate(aoiIdToRemove)
  }

  const createAOI = (name: string) => {
    createAOIMutation.mutate({ name, filters: localFilters })
  }

  const updateAOI = (aoiIdToUpdate: string, name: string) => {
    updateAOIMutation.mutate({
      aoiId: aoiIdToUpdate,
      name,
      filters: localFilters,
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white px-[max(1rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <FiltersHeader
        createAOI={createAOI}
        updateAOI={updateAOI}
        removeAOI={removeAOI}
        loading={loading}
        token={token}
        aoiName={getAOIName()}
        aoiId={getAOIId() ? String(getAOIId()) : undefined}
        loadAoiId={loadAoiId}
        handleApply={handleApply}
        handleClear={handleClear}
      />
      <FiltersList
        loading={loading}
        filters={localFilters}
        active={active}
        handleFocus={handleFocus}
        handleChange={handleChange}
        handleToggleAll={handleToggleAll}
        replaceFiltersState={replaceFiltersState}
        token={token}
        handleApply={handleApply}
        handleClear={handleClear}
      />
    </div>
  )
}
