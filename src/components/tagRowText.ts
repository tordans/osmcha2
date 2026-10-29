import type { TagRow } from './changeset/changesetElements.ts'

/** The fields of a tag row that the sign and photo helpers read; `TagRowsItem` and `TagRow` fit. */
export type TagRowText = {
  kind: TagRow['kind']
  key: string
  value?: unknown
  rawValue?: string
  oldValue?: unknown
  newValue?: unknown
  rawOld?: string
  rawNew?: string
}

/** The plain text of a value: the raw text when there is one, else the value if it is a string. */
export function textOf(value: unknown, raw?: string) {
  if (raw != null) return raw
  return typeof value === 'string' ? value : undefined
}
