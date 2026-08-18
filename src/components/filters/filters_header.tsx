import { LinkIcon, RssIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { API_URL } from '../../config/index.ts'
import { useAllAOIs } from '../../query/hooks/useAOI.ts'
import { Button } from '../ui/button.tsx'
import { Heading } from '../ui/heading.tsx'
import { Input } from '../ui/input.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'

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
  const [value, setValue] = useState(name || '')
  const inputRef = useRef<HTMLInputElement>(null)

  if (name !== undefined && !editing && value !== (name || '')) {
    setValue(name || '')
  }

  useEffect(
    function focusSaveNameInput() {
      if (!editing) return
      const input = inputRef.current
      input?.focus()
      input?.select()
    },
    [editing],
  )

  const handleSubmit = () => {
    setEditing(false)
    const matchingAoi = aoiList.find((aoi) => aoi.value === aoiId)
    if (aoiId && matchingAoi) {
      updateAOI(aoiId, value)
    } else {
      createAOI(value)
    }
  }

  if (editing) {
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <Input
          ref={inputRef}
          value={value}
          aria-label="Saved filter name"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSubmit()
            } else if (event.key === 'Escape') {
              setEditing(false)
              setValue(name || '')
            }
          }}
        />
        <Button
          type="button"
          className="min-h-11 cursor-pointer touch-manipulation select-none"
          onClick={handleSubmit}
        >
          Confirm Save
        </Button>
      </span>
    )
  }

  return (
    <Button
      type="button"
      outline
      className="min-h-11 cursor-pointer touch-manipulation select-none"
      onClick={() => {
        setEditing(true)
        setValue(name || '')
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
  search: string
  token: string | null
  aoiName?: string
  aoiId?: string
  handleApply: () => void
  handleClear: () => void
  loadAoiId: (id: string) => void
}

type AoiFeature = {
  id: string | number
  properties?: { name?: string }
}

function aoiFeatures(data: unknown): AoiFeature[] {
  if (!data) return []
  if (Array.isArray(data)) return data as AoiFeature[]
  if (typeof data === 'object' && data !== null && 'features' in data) {
    const features = (data as { features: unknown }).features
    if (Array.isArray(features)) return features as AoiFeature[]
  }
  return []
}

export function FiltersHeader({
  createAOI,
  updateAOI,
  search,
  token,
  aoiName,
  aoiId,
  handleApply,
  handleClear,
}: FiltersHeaderProps) {
  const navigate = useNavigate()
  const aoisQuery = useAllAOIs()
  const aoiList: AoiOption[] = aoiFeatures(aoisQuery.data).map((aoi) => ({
    label: aoi.properties?.name || `Filter ${aoi.id}`,
    value: String(aoi.id),
  }))
  const selectedAoi = aoiList.find((aoi) => aoi.value === aoiId) ?? null
  const closeHref = search ? `/${search}` : '/'
  const shareOrigin = API_URL.replace('/api/v1', '')

  return (
    <header className="flex flex-col gap-3 border-b border-zinc-950/10 pb-4">
      <div className="flex items-start justify-between gap-3">
        <Heading className="min-w-0 text-xl/8 sm:text-2xl/8">
          Filters
          {aoiId ? ` / ${aoiName}` : ''}
        </Heading>
        <Button
          plain
          href={closeHref}
          aria-label="Close filters"
          className="min-h-11 min-w-11 shrink-0 cursor-pointer touch-manipulation p-0 select-none"
        >
          <XMarkIcon data-slot="icon" />
        </Button>
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
                  pathname: '/filters',
                  search: `aoi=${option.value}`,
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
