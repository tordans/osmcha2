import { Button } from '../ui/button.tsx'
import { XMarkIcon } from '../ui/icons.ts'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'
import type { Filters } from './index.ts'

type MetaOption = {
  label: string
  value: Filters
}

type MetaProps = {
  placeholder?: string
  name: string
  activeFilters: Filters
  metaOf: Array<string>
  options: MetaOption[]
  replaceFiltersState: (filters: Filters) => void
}

export function Meta({
  placeholder,
  name,
  activeFilters,
  metaOf,
  options,
  replaceFiltersState,
}: MetaProps) {
  const current = findCurrentValue(activeFilters, options)

  return (
    <div className="flex items-center gap-2">
      <Listbox<MetaOption | null>
        name={name}
        value={current}
        placeholder={placeholder}
        aria-label={placeholder || name}
        onChange={(option) => {
          const next = { ...activeFilters }
          for (const key of metaOf) {
            delete next[key]
          }
          if (option?.value) {
            Object.assign(next, option.value)
          }
          replaceFiltersState(next)
        }}
      >
        {options.map((option) => (
          <ListboxOption key={option.label} value={option}>
            <ListboxLabel>{option.label}</ListboxLabel>
          </ListboxOption>
        ))}
      </Listbox>
      {current ? (
        <Button
          plain
          type="button"
          aria-label="Clear"
          className="size-11 shrink-0 p-0 sm:size-9"
          onClick={() => {
            const next = { ...activeFilters }
            for (const key of metaOf) {
              delete next[key]
            }
            replaceFiltersState(next)
          }}
        >
          <XMarkIcon data-slot="icon" />
        </Button>
      ) : null}
    </div>
  )
}

function findCurrentValue(activeFilters: Filters | undefined, options: MetaOption[]) {
  if (!activeFilters) return null

  for (const [key, value] of Object.entries(activeFilters)) {
    for (const option of options) {
      const optionKey = Object.keys(option.value)[0]
      if (value && optionKey === key && value?.[0]?.value === option.value[key]?.[0]?.value) {
        return option
      }
    }
  }
  return null
}
