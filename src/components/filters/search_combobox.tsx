import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { useState } from 'react'
import { flyoutFrostedSurfaceClassName } from '../ui/flyout.ts'
import { ChevronsUpDownIcon } from '../ui/icons.ts'

export type SearchOption = {
  label: string
  value: unknown
}

function searchOptionKey(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value == null) return ''
  return JSON.stringify(value)
}

function defaultCreateLabel(query: string) {
  return `Add ${query}`
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
  createLabel = defaultCreateLabel,
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
            'relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
            'min-h-11 pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:min-h-9 sm:pr-[calc(--spacing(9)-1px)] sm:pl-[calc(--spacing(3)-1px)]',
            'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6',
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
          <ChevronsUpDownIcon
            className="size-5 text-zinc-500 group-data-hover:text-zinc-700 sm:size-4"
            aria-hidden="true"
          />
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
          flyoutFrostedSurfaceClassName,
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
        'group/option cursor-pointer touch-manipulation rounded-lg py-2.5 pr-2 pl-3.5 select-none sm:py-1.5 sm:pr-2 sm:pl-3',
        'text-base/6 text-zinc-950 sm:text-sm/6',
        'outline-hidden data-focus:bg-blue-500 data-focus:text-white',
      )}
    >
      <span className="block truncate">{label}</span>
    </Headless.ComboboxOption>
  )
}
