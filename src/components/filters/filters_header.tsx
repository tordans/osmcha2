import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useAllAOIs } from '../../query/hooks/useAOI.ts'
import { stripFilterSearch } from '../../routing/filterSearch.ts'
import { RouterLink } from '../../routing/RouterLink.tsx'
import { aoiFeedUrl } from '../../utils/aoiFeedUrl.ts'
import { prefersTouchInput } from '../../utils/prefersTouchInput.ts'
import { Button } from '../ui/button.tsx'
import { Heading } from '../ui/heading.tsx'
import { CopyIcon, LinkIcon, RssIcon, TrashIcon, XMarkIcon } from '../ui/icons.ts'
import { Input } from '../ui/input.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'
import { Tooltip } from '../ui/tooltip.tsx'

const rootRouteApi = getRouteApi('__root__')

const buttonClassName = 'min-h-11 cursor-pointer touch-manipulation select-none'
const iconButtonClassName = 'min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none'

type AoiOption = {
  label: string
  value: string
}

/** The OSMCha2 list link of a saved filter. */
function savedFilterUrl(aoiId: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}?aoi=${encodeURIComponent(aoiId)}`
}

type SaveAsProps = {
  suggestedName: string
  pending: boolean
  onSaveAs: (name: string) => void
}

/** "Save as …": the only place that asks for a name. */
function SaveAs({ suggestedName, pending, onSaveAs }: SaveAsProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const trimmed = name.trim()

  if (!editing) {
    return (
      <Button
        type="button"
        outline
        className={buttonClassName}
        onClick={() => {
          setName(suggestedName)
          setEditing(true)
        }}
      >
        Save as…
      </Button>
    )
  }

  return (
    <form
      className="order-last flex w-full min-w-0 basis-full flex-wrap items-center gap-2 sm:flex-nowrap"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed) onSaveAs(trimmed)
      }}
    >
      <div className="min-w-48 flex-1 sm:max-w-sm">
        <Input
          autoFocus={!prefersTouchInput()}
          value={name}
          aria-label="Name of the saved filter"
          placeholder="Name of the saved filter"
          enterKeyHint="done"
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setEditing(false)
          }}
        />
      </div>
      <Button type="submit" disabled={!trimmed || pending} className={buttonClassName}>
        Save
      </Button>
      <Button type="button" plain className={buttonClassName} onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </form>
  )
}

type FiltersHeaderProps = {
  token: string | null
  /** Set when the form edits a saved filter; otherwise it edits URL filters. */
  aoiId?: string
  name: string
  onNameChange: (name: string) => void
  dirty: boolean
  /** Name of the saved filter this unsaved copy came from. */
  copyOfName?: string | null
  suggestedName: string
  saving: boolean
  onApply: () => void
  onReset: () => void
  onSaveAs: (name: string) => void
  onSave: () => void
  onDiscard: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function FiltersHeader({
  token,
  aoiId,
  name,
  onNameChange,
  dirty,
  copyOfName,
  suggestedName,
  saving,
  onApply,
  onReset,
  onSaveAs,
  onSave,
  onDiscard,
  onDuplicate,
  onDelete,
}: FiltersHeaderProps) {
  const navigate = rootRouteApi.useNavigate()
  const search = rootRouteApi.useSearch()
  const aoisQuery = useAllAOIs()
  const aoiList: AoiOption[] = (aoisQuery.data ?? []).map((aoi) => ({
    label: aoi.properties?.name || `Filter ${aoi.id}`,
    value: String(aoi.id),
  }))
  const selectedAoi = aoiList.find((aoi) => aoi.value === aoiId) ?? null
  const isSaved = Boolean(aoiId)
  const [copied, setCopied] = useState(false)

  const savedFilterPicker =
    token && aoiList.length > 0 ? (
      <div className="min-w-40 flex-1 sm:max-w-56">
        <Listbox<AoiOption | null>
          value={selectedAoi}
          placeholder="My saved filters"
          aria-label="My saved filters"
          onChange={(option) => {
            if (!option) return
            void navigate({
              to: '/filters',
              search: (prev) => ({ ...stripFilterSearch(prev), aoi: option.value }),
              replace: true,
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
    ) : null

  return (
    <header className="flex flex-col gap-3 border-b border-zinc-950/10 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading className="min-w-0 text-xl/8 sm:text-2xl/8">
            {isSaved ? 'Saved filter' : copyOfName ? 'Copy of a saved filter' : 'Filter'}
          </Heading>
          <p className="text-sm/6 text-zinc-500">
            {isSaved
              ? 'Save updates this filter and shows its list.'
              : copyOfName
                ? `Copied from “${copyOfName}”. Not saved: Apply shows it as a link, Save as… keeps it.`
                : 'Apply shows the list as a link. Save as… keeps it as a saved filter.'}
          </p>
        </div>
        <RouterLink
          to="/"
          search={search}
          aria-label="Close filters"
          className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center select-none active:opacity-60"
        >
          <XMarkIcon className="size-5" />
        </RouterLink>
      </div>

      {isSaved ? (
        <div className="max-w-md">
          <Input
            value={name}
            aria-label="Name of the saved filter"
            placeholder="Name of the saved filter"
            onChange={(event) => onNameChange(event.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {savedFilterPicker}

        {isSaved && aoiId ? (
          <>
            <Tooltip
              as="span"
              content={copied ? 'Link copied' : 'Copy link'}
              className="inline-flex"
            >
              <Button
                type="button"
                plain
                aria-label="Copy link to this saved filter"
                className={iconButtonClassName}
                onClick={() => {
                  void navigator.clipboard.writeText(savedFilterUrl(aoiId)).then(() => {
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1500)
                  })
                }}
              >
                <LinkIcon data-slot="icon" />
              </Button>
            </Tooltip>
            <Tooltip
              as="span"
              content="RSS Feed: changesets from the last 30 days at most"
              className="inline-flex"
            >
              <Button
                plain
                href={aoiFeedUrl(aoiId)}
                aria-label="RSS Feed"
                className={iconButtonClassName}
              >
                <RssIcon data-slot="icon" />
              </Button>
            </Tooltip>
            <Tooltip as="span" content="Delete this saved filter" className="inline-flex">
              <Button
                type="button"
                plain
                aria-label="Delete saved filter"
                className={iconButtonClassName}
                onClick={onDelete}
              >
                <TrashIcon data-slot="icon" />
              </Button>
            </Tooltip>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isSaved ? (
          <>
            <Button type="button" outline className={buttonClassName} onClick={onDuplicate}>
              <CopyIcon data-slot="icon" />
              Duplicate
            </Button>
            {dirty ? (
              <Button type="button" plain className={buttonClassName} onClick={onDiscard}>
                Discard changes
              </Button>
            ) : null}
            <FiltersPrimaryActions
              isSaved
              dirty={dirty}
              saving={saving}
              canSave={name.trim() !== ''}
              onApply={onApply}
              onSave={onSave}
            />
          </>
        ) : (
          <>
            <Button type="button" plain className={buttonClassName} onClick={onReset}>
              Reset
            </Button>
            {token ? (
              <SaveAs suggestedName={suggestedName} pending={saving} onSaveAs={onSaveAs} />
            ) : null}
            <FiltersPrimaryActions
              isSaved={false}
              dirty={dirty}
              saving={saving}
              canSave
              onApply={onApply}
              onSave={onSave}
            />
          </>
        )}
      </div>
    </header>
  )
}

type FiltersPrimaryActionsProps = {
  isSaved: boolean
  dirty: boolean
  saving: boolean
  canSave: boolean
  onApply: () => void
  onSave: () => void
}

/** The one main button: Save for a saved filter, Apply for URL filters. Also at the form's end. */
export function FiltersPrimaryActions({
  isSaved,
  dirty,
  saving,
  canSave,
  onApply,
  onSave,
}: FiltersPrimaryActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {dirty ? (
        <span className="text-sm/6 font-medium text-amber-700" role="status">
          {isSaved ? 'Unsaved changes' : 'Not applied yet'}
        </span>
      ) : null}
      {isSaved ? (
        <Button
          type="button"
          disabled={saving || !canSave}
          className={buttonClassName}
          onClick={onSave}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      ) : (
        <Button type="button" className={buttonClassName} onClick={onApply}>
          Apply
        </Button>
      )}
    </div>
  )
}
