export type FilterOption = {
  label: string | object
  value: string | number | object
}

export type Filter = Array<FilterOption>

export type Filters = Record<string, Filter>

export function filterOptionKey(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value == null) return ''
  return JSON.stringify(value)
}

export function filterOptionLabel(label: unknown): string {
  if (typeof label === 'string') return label
  if (label == null) return ''
  return JSON.stringify(label)
}
