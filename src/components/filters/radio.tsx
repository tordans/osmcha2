import { XMarkIcon } from '@heroicons/react/16/solid'
import { Button } from '../ui/button.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'
import { filterOptionKey, filterOptionLabel, type Filter, type FilterOption } from './index.ts'

type RadioProps = {
  name: string
  placeholder?: string
  options: FilterOption[]
  value?: Filter
  onChange: (name: string, value?: Filter | null) => void
}

export function Radio({ name, options, placeholder, value, onChange }: RadioProps) {
  const selected = value?.[0] ?? null
  const selectedOption =
    options.find((option) => filterOptionKey(option.value) === filterOptionKey(selected?.value)) ??
    null

  return (
    <div className="flex items-center gap-2">
      <Listbox<FilterOption | null>
        name={name}
        value={selectedOption}
        placeholder={placeholder}
        aria-label={placeholder || name}
        onChange={(option) => {
          if (!option || option.value === '') {
            onChange(name)
            return
          }
          onChange(name, [option])
        }}
      >
        {options.map((option) => (
          <ListboxOption key={filterOptionKey(option.value)} value={option}>
            <ListboxLabel>{filterOptionLabel(option.label)}</ListboxLabel>
          </ListboxOption>
        ))}
      </Listbox>
      {selectedOption ? (
        <Button
          plain
          type="button"
          aria-label="Clear"
          className="size-11 shrink-0 p-0 sm:size-9"
          onClick={() => onChange(name)}
        >
          <XMarkIcon data-slot="icon" />
        </Button>
      ) : null}
    </div>
  )
}
