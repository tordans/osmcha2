import { Input } from '../ui/input.tsx'
import type { Filter } from './index.ts'

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
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
      value={selected ? formatDateInput(selected) : ''}
      placeholder={placeholder || display}
      min={min ? formatDateInput(min) : undefined}
      max={max ? formatDateInput(max) : undefined}
      onChange={(event) => {
        const raw = event.target.value
        if (!raw) {
          onChange(name)
          return
        }
        const date = new Date(`${raw}T00:00:00`)
        if (Number.isNaN(date.getTime())) {
          onChange(name)
          return
        }
        const next = date.toISOString()
        onChange(name, [{ label: next, value: next }])
      }}
    />
  )
}
