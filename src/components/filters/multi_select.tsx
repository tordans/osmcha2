import { XMarkIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { API_URL } from '../../config/index.ts'
import { fetchReasons } from '../../network/reasons_tags.ts'
import { BadgeButton } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Input } from '../ui/input.tsx'
import { filterOptionKey, filterOptionLabel, type Filter, type FilterOption } from './index.ts'
import { SearchCombobox, type SearchOption } from './search_combobox.tsx'

type MultiSelectProps = {
  name: string
  display: string
  value?: Filter
  placeholder?: string
  options?: FilterOption[]
  dataURL?: string
  onChange: (name: string, value?: Filter | null) => void
  showAllToggle?: boolean
  token: string | null
  teamMode?: boolean
}

type ReasonRow = {
  id: string | number
  name: string
}

type TagRow = {
  id: string | number
  name: string
  for_changeset?: boolean
  trusted?: boolean
}

export function MultiSelect({
  name,
  display,
  value,
  placeholder,
  options = [],
  dataURL,
  onChange,
  showAllToggle = false,
  token,
  teamMode = false,
}: MultiSelectProps) {
  const [inputValue, setInputValue] = useState('')
  const [allToggle, setAllToggle] = useState(name.slice(0, 4) === 'all_')
  const [asyncOptions, setAsyncOptions] = useState<SearchOption[]>([])

  useEffect(
    function loadAsyncFilterOptions() {
      if (!dataURL) return
      let cancelled = false

      async function load() {
        if (dataURL === 'suspicion-reasons') {
          const reasons = (await fetchReasons()) as ReasonRow[]
          if (cancelled) return
          setAsyncOptions(
            reasons.map((reason) => ({
              label: reason.name,
              value: reason.id,
            })),
          )
          return
        }

        const response = await fetch(
          teamMode ? `${API_URL}/${dataURL}/` : `${API_URL}/${dataURL}/?page_size=200`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Token ${token}` : '',
            },
          },
        )
        const json = (await response.json()) as { results?: TagRow[] }
        if (cancelled) return
        const rows = json.results ?? []
        const mapped = teamMode
          ? rows.map((row) =>
              row.trusted
                ? { label: `${row.name} (verified)`, value: row.name }
                : { label: row.name.replace('(verified)', ''), value: row.name },
            )
          : rows
              .filter((row) => row.for_changeset)
              .map((row) => ({ label: row.name, value: row.id }))
        setAsyncOptions(mapped)
      }

      void load()
      return function cancelLoadAsyncFilterOptions() {
        cancelled = true
      }
    },
    [dataURL, teamMode, token],
  )

  const selected = Array.isArray(value) ? value : []

  const sendData = (nextToggle: boolean, data: Filter) => {
    let fieldName = name.slice(0, 4) === 'all_' ? name.slice(4) : name
    fieldName = `${nextToggle ? 'all_' : ''}${fieldName}`
    if (data.length === 0) {
      onChange(fieldName)
      return
    }
    onChange(
      fieldName,
      data.map((option) => ({ label: option.label, value: option.value })),
    )
  }

  const addOption = (option: SearchOption) => {
    const next: FilterOption = {
      label: option.label,
      value: option.value as FilterOption['value'],
    }
    if (selected.some((item) => filterOptionKey(item.value) === filterOptionKey(next.value))) return
    sendData(allToggle, [...selected, next])
    setInputValue('')
  }

  const removeOption = (option: FilterOption) => {
    const next = selected.filter(
      (item) => filterOptionKey(item.value) !== filterOptionKey(option.value),
    )
    sendData(allToggle, next)
  }

  const handleToggle = () => {
    const nextToggle = !allToggle
    if (selected.length > 0) {
      sendData(nextToggle, selected)
    }
    setAllToggle(nextToggle)
  }

  const addFreeform = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    addOption({ label: trimmed, value: trimmed })
  }

  const pickerOptions: SearchOption[] = dataURL
    ? asyncOptions
    : options.map((option) => ({
        label: filterOptionLabel(option.label),
        value: option.value,
      }))

  const showPicker = Boolean(dataURL) || options.length > 0

  return (
    <div className="space-y-2">
      {showAllToggle ? (
        <div className="flex gap-2">
          <Button
            type="button"
            outline
            className={clsx(
              'min-h-11 cursor-pointer touch-manipulation select-none',
              !allToggle && 'bg-zinc-200',
            )}
            onClick={() => {
              if (allToggle) handleToggle()
            }}
          >
            OR
          </Button>
          <Button
            type="button"
            outline
            className={clsx(
              'min-h-11 cursor-pointer touch-manipulation select-none',
              allToggle && 'bg-zinc-200',
            )}
            onClick={() => {
              if (!allToggle) handleToggle()
            }}
          >
            AND
          </Button>
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <BadgeButton
              key={filterOptionKey(item.value)}
              color="zinc"
              className="cursor-pointer touch-manipulation select-none"
              aria-label={`Remove ${filterOptionLabel(item.label)}`}
              onClick={() => removeOption(item)}
            >
              {filterOptionLabel(item.label)}
              <XMarkIcon data-slot="icon" className="size-4" />
            </BadgeButton>
          ))}
        </div>
      ) : null}

      {showPicker ? (
        <SearchCombobox
          name={name}
          options={pickerOptions.filter(
            (option) =>
              !selected.some(
                (item) => filterOptionKey(item.value) === filterOptionKey(option.value),
              ),
          )}
          placeholder={placeholder}
          ariaLabel={placeholder || display}
          allowCreate={!dataURL && options.length > 0}
          createLabel={(query) => `Add ${query} to ${display}`}
          onSelect={addOption}
        />
      ) : (
        <div className="flex items-center gap-2">
          <Input
            name={name}
            value={inputValue}
            placeholder={placeholder}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (inputValue === '') return
              if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault()
                addFreeform()
              }
            }}
          />
          <Button
            type="button"
            outline
            className="min-h-11 shrink-0 cursor-pointer touch-manipulation select-none"
            onClick={addFreeform}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  )
}

export function MappingTeamMultiSelect(props: MultiSelectProps) {
  return <MultiSelect {...props} teamMode />
}
