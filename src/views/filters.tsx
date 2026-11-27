import { getRouteApi, useBlocker } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { FiltersHeader, FiltersPrimaryActions } from '../components/filters/filters_header.tsx'
import { FiltersList } from '../components/filters/filters_list.tsx'
import type { Filter, Filters } from '../components/filters/filterTypes.ts'
import { Alert, AlertActions, AlertDescription, AlertTitle } from '../components/ui/alert.tsx'
import { Button } from '../components/ui/button.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { useAllAOIs, useAOI } from '../query/hooks/useAOI.ts'
import { useCreateAOI, useDeleteAOI, useUpdateAOI } from '../query/hooks/useAOIMutations.ts'
import {
  filtersIdentityKey,
  serializeFiltersToSearch,
  stripFilterSearch,
  withFilters,
} from '../routing/filterSearch.ts'
import {
  getFilterCopyActions,
  useFilterCopyFiltersKey,
  useFilterCopySourceId,
  useFilterCopySourceName,
} from '../stores/filter-copy-store.ts'
import {
  applyFilterChange,
  deserializeFiltersFromObject,
  savedFiltersForForm,
  suggestFilterName,
  withSavedFilterDate,
} from '../utils/filters.ts'

function filtersKey(filters: Filters) {
  return JSON.stringify(serializeFiltersToSearch(filters))
}

const rootRouteApi = getRouteApi('__root__')

/**
 * The filter form edits one of two things, never both:
 * - URL filters (no `aoi`): Apply writes them to the list URL; Save as… turns them into a saved filter.
 * - A saved filter (`aoi` only): Save overwrites that same filter and shows its list;
 *   Duplicate opens a copy as URL filters.
 */
export function Filters() {
  const { token } = useAuth()
  const navigate = rootRouteApi.useNavigate()
  const { filters: urlFilters, aoiId } = useFilters()
  const filtersFromUrl = urlFilters as Filters
  const isSaved = Boolean(aoiId)

  const { data: aoi, isLoading: aoiLoading } = useAOI(aoiId)
  const aoisQuery = useAllAOIs()
  const createAOIMutation = useCreateAOI()
  const updateAOIMutation = useUpdateAOI()
  const deleteAOIMutation = useDeleteAOI()

  const copyStoredId = useFilterCopySourceId()
  const copyFiltersKey = useFilterCopyFiltersKey()
  const copySourceStoredName = useFilterCopySourceName()
  // Only the list the copy was made as: another URL list is not that copy.
  const copySourceId =
    copyStoredId && !aoiId && copyFiltersKey === filtersIdentityKey(filtersFromUrl)
      ? copyStoredId
      : null
  const copySourceName = copySourceId
    ? copySourceStoredName ||
      (aoisQuery.data ?? []).find((item) => String(item.id) === copySourceId)?.properties?.name ||
      'a saved filter'
    : null

  // What the form starts from, and what "unsaved changes" compares against.
  const savedName = (aoi?.properties?.name ?? '').trim()
  const sourceFilters: Filters = isSaved
    ? aoi?.properties?.filters
      ? savedFiltersForForm(deserializeFiltersFromObject(aoi.properties.filters))
      : {}
    : filtersFromUrl
  const sourceKey = isSaved
    ? `aoi:${aoiId}:${aoi ? JSON.stringify(aoi.properties ?? {}) : 'loading'}`
    : `url:${filtersKey(filtersFromUrl)}`

  const [localFilters, setLocalFilters] = useState<Filters>(sourceFilters)
  const [name, setName] = useState(savedName)
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey)
  const [prevSourceFilters, setPrevSourceFilters] = useState(sourceFilters)
  const [prevSavedName, setPrevSavedName] = useState(savedName)
  const [active, setActive] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey)
    // A refetch of the same saved filter (changed in another tab) keeps edits in progress;
    // "Unsaved changes" then compares against the new version.
    const sameSavedFilter =
      isSaved && prevSourceKey.startsWith(`aoi:${aoiId}:`) && !prevSourceKey.endsWith(':loading')
    const hasEdits =
      filtersKey(localFilters) !== filtersKey(prevSourceFilters) || name.trim() !== prevSavedName
    if (!(sameSavedFilter && hasEdits)) {
      setLocalFilters(sourceFilters)
      setName(savedName)
    }
    setPrevSourceFilters(sourceFilters)
    setPrevSavedName(savedName)
  }

  const loading = (isSaved && aoiLoading) || createAOIMutation.isPending
  const saving =
    createAOIMutation.isPending || updateAOIMutation.isPending || deleteAOIMutation.isPending
  const dirty =
    !loading &&
    (filtersKey(localFilters) !== filtersKey(sourceFilters) ||
      (isSaved && aoi != null && name.trim() !== savedName))

  // Leaving after Apply, Save, Duplicate or Delete is intended: let that one navigation through.
  const leavingOnPurposeRef = useRef(false)
  const blocker = useBlocker({
    shouldBlockFn: ({ next }) => {
      let block = dirty
      if (leavingOnPurposeRef.current) {
        leavingOnPurposeRef.current = false
        block = false
      }
      // "Copy of …" belongs to this visit of the form; Duplicate stays on it and keeps it.
      if (!block && next.fullPath !== '/filters') getFilterCopyActions().clear()
      return block
    },
    enableBeforeUnload: () => dirty,
    withResolver: true,
  })

  function leaveOnPurpose() {
    leavingOnPurposeRef.current = true
  }

  const handleApply = () => {
    const hasFilters = Object.keys(localFilters).length > 0
    leaveOnPurpose()
    getFilterCopyActions().clear()
    void navigate({
      to: '/',
      search: (prev) =>
        withFilters(
          { ...prev, aoi: undefined, page: undefined },
          hasFilters ? localFilters : undefined,
        ),
      replace: true,
    })
  }

  const handleReset = () => {
    leaveOnPurpose()
    getFilterCopyActions().clear()
    void navigate({
      to: '/',
      search: (prev) => ({ ...stripFilterSearch(prev), aoi: undefined, page: undefined }),
    })
  }

  const handleSaveAs = (newName: string) => {
    // The create hook opens the new saved filter's list itself, before this call's onSuccess.
    leaveOnPurpose()
    createAOIMutation.mutate(
      { name: newName, filters: withSavedFilterDate(localFilters) },
      {
        onSuccess: () => getFilterCopyActions().clear(),
        onError: () => {
          leavingOnPurposeRef.current = false
        },
      },
    )
  }

  const handleSave = () => {
    if (!aoiId) return
    updateAOIMutation.mutate(
      { aoiId, name: name.trim(), filters: withSavedFilterDate(localFilters) },
      {
        onSuccess: () => {
          leaveOnPurpose()
          void navigate({
            to: '/',
            search: (prev) => ({ ...stripFilterSearch(prev), aoi: aoiId, page: undefined }),
            replace: true,
          })
        },
      },
    )
  }

  const handleDiscard = () => {
    setLocalFilters(sourceFilters)
    setName(savedName)
  }

  const handleDuplicate = () => {
    if (!aoiId) return
    getFilterCopyActions().set(
      aoiId,
      filtersIdentityKey(localFilters),
      name.trim() || savedName || null,
    )
    leaveOnPurpose()
    void navigate({
      to: '/filters',
      search: (prev) =>
        withFilters({ ...stripFilterSearch(prev), aoi: undefined, page: undefined }, localFilters),
    })
  }

  const handleDelete = () => {
    if (!aoiId) return
    deleteAOIMutation.mutate(aoiId, {
      onSuccess: () => {
        setDeleteOpen(false)
        leaveOnPurpose()
        void navigate({
          to: '/',
          search: (prev) => ({ ...stripFilterSearch(prev), aoi: undefined, page: undefined }),
          replace: true,
        })
      },
    })
  }

  const handleChange = (filterName: string, values?: Filter | null) => {
    setLocalFilters((prevFilters) => applyFilterChange(prevFilters, filterName, values))
  }

  const handleToggleAll = (filterName: string, values?: Filter | null) => {
    setLocalFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      const isAll = filterName.slice(0, 4) === 'all_'

      if (isAll) {
        delete newFilters[filterName.slice(4)]
      } else {
        delete newFilters[`all_${filterName}`]
      }

      if (!values) {
        delete newFilters[filterName]
      } else {
        newFilters[filterName] = values
      }
      return newFilters
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white px-[max(1rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <FiltersHeader
        token={token}
        aoiId={aoiId ?? undefined}
        name={name}
        onNameChange={setName}
        dirty={dirty}
        copyOfName={isSaved ? null : copySourceName}
        suggestedName={
          copySourceName ? `${copySourceName} (copy)` : suggestFilterName(localFilters)
        }
        saving={saving}
        onApply={handleApply}
        onReset={handleReset}
        onSaveAs={handleSaveAs}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onDuplicate={handleDuplicate}
        onDelete={() => setDeleteOpen(true)}
      />
      <FiltersList
        loading={loading}
        filters={localFilters}
        active={active}
        handleFocus={setActive}
        handleChange={handleChange}
        handleToggleAll={handleToggleAll}
        replaceFiltersState={setLocalFilters}
        token={token}
        footer={
          <FiltersPrimaryActions
            isSaved={isSaved}
            dirty={dirty}
            saving={saving}
            canSave={name.trim() !== ''}
            onApply={handleApply}
            onSave={handleSave}
          />
        }
      />

      <Alert open={blocker.status === 'blocked'} onClose={() => blocker.reset?.()} size="sm">
        <AlertTitle>Discard unsaved changes?</AlertTitle>
        <AlertDescription>
          {isSaved
            ? 'Your changes to this saved filter are not saved yet.'
            : 'Your filter changes are not applied yet.'}
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => blocker.reset?.()}>
            Keep editing
          </Button>
          <Button
            onClick={() => {
              if (blocker.next?.fullPath !== '/filters') getFilterCopyActions().clear()
              blocker.proceed?.()
            }}
          >
            Discard changes
          </Button>
        </AlertActions>
      </Alert>

      <Alert open={deleteOpen} onClose={() => setDeleteOpen(false)} size="sm">
        <AlertTitle>Delete “{savedName || 'this saved filter'}”?</AlertTitle>
        <AlertDescription>
          The saved filter, its link and its RSS feed stop working. This cannot be undone.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button color="red" disabled={deleteAOIMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </div>
  )
}
