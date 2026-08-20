import clsx from 'clsx'
import { useState } from 'react'
import { useFilterAsyncOptions } from '../../query/hooks/useFilterAsyncOptions.ts'
import { BadgeButton } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { XMarkIcon } from '../ui/icons.ts'
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
  const { data: asyncOptions = [] } = useFilterAsyncOptions(dataURL, token, teamMode)

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
            className={clsx(!allToggle && 'bg-zinc-200')}
            onClick={() => {
              if (allToggle) handleToggle()
            }}
          >
            OR
          </Button>
          <Button
            type="button"
            outline
            className={clsx(allToggle && 'bg-zinc-200')}
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
          <Button type="button" outline className="shrink-0" onClick={addFreeform}>
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
