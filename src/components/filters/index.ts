export { DateField, parseStoredDate } from './date.tsx'
export { LocationSelect } from './location.tsx'
export { Meta } from './meta.tsx'
export { MetadataFilter } from './metadata.tsx'
export { MappingTeamMultiSelect, MultiSelect } from './multi_select.tsx'
export { Radio } from './radio.tsx'
export { Text } from './text.tsx'
export { Wrapper } from './wrapper.tsx'

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
