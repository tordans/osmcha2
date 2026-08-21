import { filterOptionKey, type Filter } from '../components/filters/filterTypes.ts'
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

function isKeyValueToken(token: string): boolean {
  const eqIndex = token.indexOf('=')
  return eqIndex > 0 && eqIndex === token.lastIndexOf('=')
}

function splitMetadataTokens(raw: string): { tokens: string[]; leftover: boolean } {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  const tokens = parts.filter(isKeyValueToken)
  return { tokens, leftover: tokens.length !== parts.length }
}

function tokenUsesUnsupportedLookup(keyPart: string): boolean {
  if (!keyPart.includes('__')) return false
  const suffix = keyPart.slice(keyPart.lastIndexOf('__') + 2)
  return !SUPPORTED_SUFFIXES.has(suffix)
}

function parseMetadataToken(token: string, id: string): { row: MetadataRow; unsupported: boolean } {
  const eqIndex = token.indexOf('=')
  const keyPart = token.slice(0, eqIndex).trim()
  const valuePart = token.slice(eqIndex + 1).trim()
  const unsupported = tokenUsesUnsupportedLookup(keyPart)

  if (valuePart === '*') {
    return { row: { id, key: keyPart, operator: 'exists', value: '' }, unsupported }
  }

  const minMatch = keyPart.match(/^(.+)__min$/)
  if (minMatch) {
    return { row: { id, key: minMatch[1], operator: 'min', value: valuePart }, unsupported }
  }

  const maxMatch = keyPart.match(/^(.+)__max$/)
  if (maxMatch) {
    return { row: { id, key: maxMatch[1], operator: 'max', value: valuePart }, unsupported }
  }

  const exactMatch = keyPart.match(/^(.+)__exact$/)
  if (exactMatch) {
    return { row: { id, key: exactMatch[1], operator: 'equals', value: valuePart }, unsupported }
  }

  const key = unsupported ? (keyPart.split('__')[0] ?? keyPart) : keyPart
  return { row: { id, key, operator: 'contains', value: valuePart }, unsupported }
}

export function joinMetadataFilterValue(filter?: Filter): string {
  if (!filter?.length) return ''
  return filter
    .map((item) => filterOptionKey(item.value))
    .filter((value) => value !== '')
    .join(',')
}

export function parseMetadataQuery(raw: string): { rows: MetadataRow[]; unsupported: boolean } {
  if (!raw.trim()) return { rows: [], unsupported: false }

  const { tokens, leftover } = splitMetadataTokens(raw)
  if (!tokens.length) return { rows: [], unsupported: true }

  let unsupported = leftover
  const rows: MetadataRow[] = []
  for (const [index, token] of tokens.entries()) {
    const parsed = parseMetadataToken(token, String(index))
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
  const serialized = serializeMetadataRows(rows)
  if (!serialized) return undefined
  return serialized.split(',').map((value) => ({ label: value, value }))
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
      if (!/^-?\d+$/.test(row.value.trim())) return 'Enter a whole number.'
      return null
    }
    case 'contains':
    case 'equals': {
      const trimmed = row.value.trim()
      if (!trimmed) return 'Value is required.'
      if (trimmed.includes(',')) return 'Value cannot contain commas.'
      if (trimmed.includes('=')) return 'Value cannot contain =.'
      return null
    }
    default:
      return 'Invalid match type.'
  }
}

export function isSupportedMetadataQuery(raw: string): boolean {
  return !parseMetadataQuery(raw).unsupported
}

export function canonicalMetadataQuery(raw: string): string {
  if (!raw.trim()) return ''
  const parsed = parseMetadataQuery(raw)
  if (parsed.unsupported) return raw.trim()
  return serializeMetadataRows(parsed.rows)
}

export function createEmptyMetadataRow(): MetadataRow {
  return { id: newRowId(), key: '', operator: 'contains', value: '' }
}
