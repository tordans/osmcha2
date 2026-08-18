import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { validateFilters } from '../utils/filters.ts'

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  let filters: Record<string, any> = {}
  try {
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      filters = JSON.parse(filtersParam)
    }
  } catch (error) {
    console.error('Failed to parse filters from URL:', error)
  }

  const aoiId = searchParams.get('aoi')

  function setFilters(newFilters: any) {
    try {
      // Validate filters before setting
      validateFilters(newFilters)

      const newParams = new URLSearchParams()

      // Only add filters param if there are filters
      if (newFilters && Object.keys(newFilters).length > 0) {
        const filtersString = JSON.stringify(newFilters)

        // Check if filters are too large
        if (filtersString.length > 7000) {
          toast.error('Filter too large', {
            description: 'Your filter is too big. Please save it as an AOI instead.',
          })
          return
        }

        newParams.set('filters', filtersString)
      }

      // Preserve AOI if it exists and we're not clearing filters
      const currentAoi = searchParams.get('aoi')
      if (currentAoi && Object.keys(newFilters).length > 0) {
        newParams.set('aoi', currentAoi)
      }

      setSearchParams(newParams, { replace: false })
    } catch (error) {
      console.error('Failed to set filters:', error)
      toast.error('Invalid filters', {
        description: error instanceof Error ? error.message : 'Failed to apply filters',
      })

      // Clear filters on error
      setSearchParams(new URLSearchParams(), { replace: false })
    }
  }

  function setAoiId(nextAoiId: string | null) {
    const newParams = new URLSearchParams()
    if (nextAoiId) {
      newParams.set('aoi', nextAoiId)
    }
    setSearchParams(newParams, { replace: false })
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: false })
  }

  return {
    filters,
    aoiId,
    setFilters,
    setAoiId,
    clearFilters,
  }
}
