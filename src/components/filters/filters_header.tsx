import { useForm } from '@tanstack/react-form'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { API_URL } from '../../config/constants.ts'
import { useAllAOIs } from '../../query/hooks/useAOI.ts'
import { stripFilterSearch } from '../../routing/filterSearch.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import { Button } from '../ui/button.tsx'
import { Heading } from '../ui/heading.tsx'
import { LinkIcon, RssIcon, XMarkIcon } from '../ui/icons.ts'
import { Input } from '../ui/input.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'

const rootRouteApi = getRouteApi('__root__')

type AoiOption = {
  label: string
  value: string
}

type SaveAOIProps = {
  name?: string
  aoiList: AoiOption[]
  aoiId?: string
  updateAOI: (id: string, name: string) => void
  createAOI: (name: string) => void
}

function SaveAOI({ name, aoiList, aoiId, updateAOI, createAOI }: SaveAOIProps) {
  const [editing, setEditing] = useState(false)

  const form = useForm({
    defaultValues: { name: name || '' },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(1, 'Filter name is required'),
      }),
    },
    onSubmit: ({ value }) => {
      setEditing(false)
      const trimmedName = value.name.trim()
      const matchingAoi = aoiList.find((aoi) => aoi.value === aoiId)
      if (aoiId && matchingAoi) {
        updateAOI(aoiId, trimmedName)
      } else {
        createAOI(trimmedName)
      }
    },
  })

  if (editing) {
    return (
      <form
        className="flex min-w-0 flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field name="name">
          {(field) => (
            <Input
              autoFocus
              value={field.state.value}
              aria-label="Saved filter name"
              onFocus={(event) => event.currentTarget.select()}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setEditing(false)
                  form.setFieldValue('name', name || '')
                }
              }}
            />
          )}
        </form.Field>
        <Button type="submit" className="min-h-11 cursor-pointer touch-manipulation select-none">
          Confirm Save
        </Button>
      </form>
    )
  }

  return (
    <Button
      type="button"
      outline
      className="min-h-11 cursor-pointer touch-manipulation select-none"
      onClick={() => {
        form.setFieldValue('name', name || '')
        setEditing(true)
      }}
    >
      Save
    </Button>
  )
}

type FiltersHeaderProps = {
  createAOI: (name: string) => void
  updateAOI: (id: string, name: string) => void
  removeAOI: (id: string) => void
  loading: boolean
  token: string | null
  aoiName?: string
  aoiId?: string
  handleApply: () => void
  handleClear: () => void
  loadAoiId: (id: string) => void
}

export function FiltersHeader({
  createAOI,
  updateAOI,
  token,
  aoiName,
  aoiId,
  handleApply,
  handleClear,
}: FiltersHeaderProps) {
  const navigate = rootRouteApi.useNavigate()
  const search = rootRouteApi.useSearch()
  const aoisQuery = useAllAOIs()
  const aoiList: AoiOption[] = (aoisQuery.data ?? []).map((aoi) => ({
    label: aoi.properties?.name || `Filter ${aoi.id}`,
    value: String(aoi.id),
  }))
  const selectedAoi = aoiList.find((aoi) => aoi.value === aoiId) ?? null
  const shareOrigin = API_URL.replace('/api/v1', '')

  return (
    <header className="flex flex-col gap-3 border-b border-zinc-950/10 pb-4">
      <div className="flex items-start justify-between gap-3">
        <Heading className="min-w-0 text-xl/8 sm:text-2xl/8">
          Filters
          {aoiId ? ` / ${aoiName}` : ''}
        </Heading>
        <RouterLink
          to="/"
          search={search}
          aria-label="Close filters"
          className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center select-none"
        >
          <XMarkIcon className="size-5" />
        </RouterLink>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {token && aoiList.length > 0 ? (
          <div className="min-w-40 flex-1 sm:max-w-56">
            <Listbox<AoiOption | null>
              value={selectedAoi}
              placeholder="My Filters"
              aria-label="My Filters"
              onChange={(option) => {
                if (!option) return
                void navigate({
                  to: '/filters',
                  search: (prev) => ({ ...stripFilterSearch(prev), aoi: option.value }),
                })
              }}
            >
              {aoiList.map((option) => (
                <ListboxOption key={option.value} value={option}>
                  <ListboxLabel>{option.label}</ListboxLabel>
                </ListboxOption>
              ))}
            </Listbox>
          </div>
        ) : null}

        {aoiId ? (
          <>
            <Button
              type="button"
              plain
              aria-label="Copy filter URL"
              title="Copy filter URL"
              className="min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none"
              onClick={() => {
                void navigator.clipboard.writeText(`${shareOrigin}/?aoi=${aoiId}`)
              }}
            >
              <LinkIcon data-slot="icon" />
            </Button>
            <Button
              plain
              href={`${API_URL}/aoi/${aoiId}/changesets/feed/`}
              aria-label="RSS Feed"
              title="RSS Feed"
              className="min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none"
            >
              <RssIcon data-slot="icon" />
            </Button>
          </>
        ) : null}

        {token ? (
          <SaveAOI
            name={aoiName}
            aoiId={aoiId}
            aoiList={aoiList}
            createAOI={createAOI}
            updateAOI={updateAOI}
          />
        ) : null}

        <Button
          type="button"
          outline
          className="min-h-11 cursor-pointer touch-manipulation select-none"
          onClick={handleClear}
        >
          Reset
        </Button>
        <Button
          type="button"
          className="min-h-11 cursor-pointer touch-manipulation select-none"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </header>
  )
}
