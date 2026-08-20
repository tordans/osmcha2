import { filterOptionKey, type Filter } from '../components/filters/index.ts'
import { metadataKeyConfig } from '../config/changesetMetadataKeys.ts'

export type MetadataOperator = 'contains' | 'exists' | 'equals' | 'min' | 'max'

export type MetadataRow = {
  id: string
  key: string
  operator: MetadataOperator
  value: string
}

const SUPPORTED_SUFFIXES = new Set(['min', 'max', 'exact'])

function newRowId(): string {
  return crypto.randomUUID()
}

function splitMetadataTokens(raw: string): string[] {
  return raw
    .split(',')
    .map((token) => token.trim())
    .filter((token) => {
      if (!token) return false
      const eqIndex = token.indexOf('=')
      return eqIndex > 0 && eqIndex === token.lastIndexOf('=')
    })
}

function tokenUsesUnsupportedLookup(keyPart: string): boolean {
  if (!keyPart.includes('__')) return false
  const suffix = keyPart.slice(keyPart.lastIndexOf('__') + 2)
  return !SUPPORTED_SUFFIXES.has(suffix)
}

function parseMetadataToken(token: string): { row: MetadataRow; unsupported: boolean } {
  const eqIndex = token.indexOf('=')
  const keyPart = token.slice(0, eqIndex).trim()
  const valuePart = token.slice(eqIndex + 1).trim()
  const unsupported = tokenUsesUnsupportedLookup(keyPart)

  if (valuePart === '*') {
    return {
      row: { id: newRowId(), key: keyPart, operator: 'exists', value: '' },
      unsupported,
    }
  }

  const minMatch = keyPart.match(/^(.+)__min$/)
  if (minMatch) {
    return {
      row: { id: newRowId(), key: minMatch[1], operator: 'min', value: valuePart },
      unsupported,
    }
  }

  const maxMatch = keyPart.match(/^(.+)__max$/)
  if (maxMatch) {
    return {
      row: { id: newRowId(), key: maxMatch[1], operator: 'max', value: valuePart },
      unsupported,
    }
  }

  const exactMatch = keyPart.match(/^(.+)__exact$/)
  if (exactMatch) {
    return {
      row: {
        id: newRowId(),
        key: exactMatch[1],
        operator: 'equals',
        value: valuePart,
      },
      unsupported,
    }
  }

  const baseKey = unsupported ? keyPart.split('__')[0] : keyPart
  return {
    row: { id: newRowId(), key: baseKey, operator: 'contains', value: valuePart },
    unsupported,
  }
}

export function joinMetadataFilterValue(filter?: Filter): string {
  if (!filter?.length) return ''
  return filter
    .map((item) => filterOptionKey(item.value))
    .filter((value) => value !== '')
    .join(',')
}

export function parseMetadataQuery(raw: string): { rows: MetadataRow[]; unsupported: boolean } {
  if (!raw.trim()) {
    return { rows: [], unsupported: false }
  }

  const tokens = splitMetadataTokens(raw)
  let unsupported = false
  const rows: MetadataRow[] = []

  for (const token of tokens) {
    const parsed = parseMetadataToken(token)
    if (parsed.unsupported) unsupported = true
    rows.push(parsed.row)
  }

  return { rows, unsupported }
}

function serializeMetadataRow(row: MetadataRow): string | null {
  if (validateMetadataRow(row) !== null) return null

  const key = row.key.trim()
  switch (row.operator) {
    case 'exists':
      return `${key}=*`
    case 'min':
      return `${key}__min=${row.value.trim()}`
    case 'max':
      return `${key}__max=${row.value.trim()}`
    case 'equals':
      return `${key}__exact=${row.value.trim()}`
    case 'contains':
      return `${key}=${row.value.trim()}`
    default:
      return null
  }
}

export function serializeMetadataRows(rows: MetadataRow[]): string {
  return rows
    .map((row) => serializeMetadataRow(row))
    .filter((value): value is string => value !== null)
    .join(',')
}

export function metadataRowsToFilter(rows: MetadataRow[]): Filter | undefined {
  const items = rows
    .map((row) => serializeMetadataRow(row))
    .filter((value): value is string => value !== null)
    .map((value) => ({ label: value, value }))

  return items.length ? items : undefined
}

function hasInvalidKeyChars(key: string): boolean {
  return key.includes('=') || key.includes(',')
}

export function validateMetadataRow(row: MetadataRow): string | null {
  const key = row.key.trim()
  if (!key) return 'Key is required.'
  if (hasInvalidKeyChars(key)) return 'Key cannot contain = or commas.'

  const config = metadataKeyConfig(key)
  if (config && !config.operators.includes(row.operator)) {
    return `“${config.label}” does not support this match type.`
  }

  switch (row.operator) {
    case 'exists':
      return null
    case 'min':
    case 'max': {
      const trimmed = row.value.trim()
      if (!/^-?\d+$/.test(trimmed)) return 'Enter a whole number.'
      return null
    }
    case 'contains':
    case 'equals': {
      const trimmed = row.value.trim()
      if (!trimmed) return 'Value is required.'
      if (trimmed.includes(',')) return 'Value cannot contain commas.'
      return null
    }
    default:
      return 'Invalid match type.'
  }
}

export function isSupportedMetadataQuery(raw: string): boolean {
  if (!raw.trim()) return true

  const tokens = splitMetadataTokens(raw)
  if (!tokens.length && raw.trim()) {
    return true
  }

  for (const token of tokens) {
    const eqIndex = token.indexOf('=')
    const keyPart = token.slice(0, eqIndex).trim()
    if (tokenUsesUnsupportedLookup(keyPart)) return false
  }

  return true
}

export function createEmptyMetadataRow(): MetadataRow {
  return { id: newRowId(), key: '', operator: 'contains', value: '' }
}
