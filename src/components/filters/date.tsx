import * as Headless from '@headlessui/react'
import { isValid, parseISO } from 'date-fns'
import { formatLocalDate, localDateFromIsoDate, startOfLocalDay } from '../../utils/datetime.ts'
import { getDefaultFromDate, lastDaysFilter } from '../../utils/filters.ts'
import { Button } from '../ui/button.tsx'
import { Label } from '../ui/fieldset.tsx'
import { Input } from '../ui/input.tsx'
import { Radio } from '../ui/radio.tsx'
import type { Filter, Filters } from './filterTypes.ts'
import { Text } from './text.tsx'

const LAST_DAYS_PRESETS = [2, 7, 30] as const
const DEFAULT_LAST_DAYS = 7

type DateFieldProps = {
  name: string
  display: string
  placeholder?: string
  value?: Filter
  className?: string
  onChange: (name: string, value?: Filter | null) => void
  min?: Date
  max?: Date
}

/** Parse a stored UTC timestamp to a local Date for display. */
export function parseStoredDate(value?: string): Date | null {
  if (!value) return null
  let s = value.trim().replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    s += 'T00:00:00Z'
  } else if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) &&
    !s.endsWith('Z') &&
    !/[+-]\d{2}:\d{2}$/.test(s)
  ) {
    // Has time but no timezone indicator — treat as UTC (old format).
    s += 'Z'
  }
  const d = parseISO(s)
  return isValid(d) ? d : null
}

export function DateField({
  name,
  display,
  placeholder,
  value,
  className,
  onChange,
  min,
  max,
}: DateFieldProps) {
  const dateValue = value?.[0]?.value
  const selected = dateValue && typeof dateValue === 'string' ? parseStoredDate(dateValue) : null

  return (
    <Input
      type="date"
      name={name}
      className={className}
      value={selected ? formatLocalDate(selected) : ''}
      placeholder={placeholder || display}
      min={min ? formatLocalDate(min) : undefined}
      max={max ? formatLocalDate(max) : undefined}
      onChange={(event) => {
        const raw = event.target.value
        if (!raw) {
          onChange(name)
          return
        }
        const date = localDateFromIsoDate(raw)
        if (!date) {
          onChange(name)
          return
        }
        const next = date.toISOString()
        onChange(name, [{ label: next, value: next }])
      }}
    />
  )
}

type DateMode = 'last_days' | 'range'

type ChangesetDateFilterProps = {
  filters: Filters
  display: string
  onChange: (name: string, value?: Filter | null) => void
}

function lastDaysNumber(filters: Filters): number | undefined {
  const raw = filters.last_days?.[0]?.value
  if (raw === '' || raw == null) return undefined
  const days = Number(raw)
  if (!Number.isFinite(days) || days < 0) return undefined
  return Math.floor(days)
}

export function ChangesetDateFilter({ filters, display, onChange }: ChangesetDateFilterProps) {
  const days = lastDaysNumber(filters)
  const lastDaysActive = days != null
  const mode: DateMode = lastDaysActive ? 'last_days' : 'range'
  const defaultDate = getDefaultFromDate().date__gte
  const gteValue = filters.date__gte || defaultDate
  const lteValue = filters.date__lte
  const today = startOfLocalDay()
  const gteDate = parseStoredDate(gteValue?.[0]?.value as string | undefined) ?? undefined
  const lteDate = parseStoredDate(lteValue?.[0]?.value as string | undefined) ?? undefined

  const setMode = (next: DateMode) => {
    if (next === 'last_days') {
      onChange('last_days', lastDaysFilter(days ?? DEFAULT_LAST_DAYS))
      return
    }
    onChange('last_days')
  }

  return (
    <div className="flex flex-col gap-3">
      <Headless.RadioGroup
        value={mode}
        onChange={setMode}
        aria-label="Date filter mode"
        className="flex flex-wrap gap-x-6 gap-y-1"
      >
        <Headless.Field className="flex min-h-11 cursor-pointer items-center gap-2 select-none sm:min-h-9">
          <Radio value="last_days" />
          <Label>Last N days</Label>
        </Headless.Field>
        <Headless.Field className="flex min-h-11 cursor-pointer items-center gap-2 select-none sm:min-h-9">
          <Radio value="range" />
          <Label>Date range</Label>
        </Headless.Field>
      </Headless.RadioGroup>

      {lastDaysActive ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-24">
              <Text
                name="last_days"
                type="number"
                display="Days"
                placeholder="Days"
                value={filters.last_days}
                onChange={onChange}
                min={0}
              />
            </div>
            <span className="text-base/6 text-zinc-500 sm:text-sm/6">days</span>
            {LAST_DAYS_PRESETS.map((preset) =>
              days === preset ? (
                <Button
                  key={preset}
                  type="button"
                  aria-label={`Last ${preset} days`}
                  aria-pressed="true"
                  className="min-w-11"
                  onClick={() => onChange('last_days', lastDaysFilter(preset))}
                >
                  {preset}
                </Button>
              ) : (
                <Button
                  key={preset}
                  type="button"
                  outline
                  aria-label={`Last ${preset} days`}
                  aria-pressed="false"
                  className="min-w-11"
                  onClick={() => onChange('last_days', lastDaysFilter(preset))}
                >
                  {preset}
                </Button>
              ),
            )}
          </div>
          <DateField
            name="date__lte"
            display={display}
            value={lteValue}
            placeholder="To"
            onChange={onChange}
            max={today}
          />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <DateField
            name="date__gte"
            display={display}
            value={gteValue}
            placeholder="From"
            onChange={onChange}
            max={lteDate || today}
          />
          <DateField
            name="date__lte"
            display={display}
            value={lteValue}
            placeholder="To"
            onChange={onChange}
            min={gteDate}
            max={today}
          />
        </div>
      )}
    </div>
  )
}
