import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { useState } from 'react'

export type SearchOption = {
  label: string
  value: unknown
}

function searchOptionKey(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value == null) return ''
  return JSON.stringify(value)
}

type SearchComboboxProps = {
  options: SearchOption[]
  placeholder?: string
  ariaLabel?: string
  selected?: SearchOption | null
  onSelect: (option: SearchOption) => void
  onQueryChange?: (query: string) => void
  clientFilter?: boolean
  allowCreate?: boolean
  createLabel?: (query: string) => string
  name?: string
}

export function SearchCombobox({
  options,
  placeholder,
  ariaLabel,
  selected = null,
  onSelect,
  onQueryChange,
  clientFilter = true,
  allowCreate = false,
  createLabel = (query) => `Add ${query}`,
  name,
}: SearchComboboxProps) {
  const [query, setQuery] = useState('')

  const filtered = clientFilter
    ? query === ''
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const canCreate =
    allowCreate &&
    query.trim() !== '' &&
    !options.some((option) => option.label.toLowerCase() === query.trim().toLowerCase())

  const createOption: SearchOption | null = canCreate
    ? { label: query.trim(), value: query.trim() }
    : null

  return (
    <Headless.Combobox
      value={selected}
      immediate
      name={name}
      onChange={(option: SearchOption | null) => {
        if (option) onSelect(option)
      }}
      onClose={() => setQuery('')}
    >
      <span
        data-slot="control"
        className={clsx(
          'relative block w-full',
          'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm',
          'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-blue-500',
        )}
      >
        <Headless.ComboboxInput
          aria-label={ariaLabel || placeholder}
          displayValue={(option: SearchOption | null) => option?.label ?? ''}
          placeholder={placeholder}
          className={clsx(
            'relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)]',
            'pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)]',
            'text-base/6 text-zinc-950 placeholder:text-zinc-500',
            'border border-zinc-950/10 bg-transparent focus:outline-hidden',
            'data-hover:border-zinc-950/20',
          )}
          onChange={(event) => {
            const next = event.target.value
            setQuery(next)
            onQueryChange?.(next)
          }}
        />
        <Headless.ComboboxButton className="group absolute inset-y-0 right-0 flex cursor-pointer touch-manipulation items-center px-2 select-none">
          <svg
            className="size-5 stroke-zinc-500 group-data-hover:stroke-zinc-700"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M5.75 10.75L8 13L10.25 10.75"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.25 5.25L8 3L5.75 5.25"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Headless.ComboboxButton>
      </span>
      <Headless.ComboboxOptions
        transition
        anchor="bottom"
        className={clsx(
          '[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(4)]',
          'isolate min-w-[calc(var(--input-width)+8px)] scroll-py-1 rounded-xl p-1 select-none empty:invisible',
          'outline outline-transparent focus:outline-hidden',
          'overflow-y-scroll overscroll-contain',
          'bg-white/75 shadow-lg ring-1 ring-zinc-950/10 backdrop-blur-xl',
          'transition-opacity duration-100 ease-in data-closed:data-leave:opacity-0 data-transition:pointer-events-none',
        )}
      >
        {createOption ? (
          <SearchOptionItem option={createOption} label={createLabel(createOption.label)} />
        ) : null}
        {filtered.map((option) => (
          <SearchOptionItem
            key={`${option.label}:${searchOptionKey(option.value)}`}
            option={option}
            label={option.label}
          />
        ))}
      </Headless.ComboboxOptions>
    </Headless.Combobox>
  )
}

function SearchOptionItem({ option, label }: { option: SearchOption; label: string }) {
  return (
    <Headless.ComboboxOption
      value={option}
      className={clsx(
        'group/option cursor-pointer touch-manipulation rounded-lg py-2.5 pr-2 pl-3.5 select-none',
        'text-base/6 text-zinc-950',
        'outline-hidden data-focus:bg-blue-500 data-focus:text-white',
      )}
    >
      <span className="block truncate">{label}</span>
    </Headless.ComboboxOption>
  )
}
