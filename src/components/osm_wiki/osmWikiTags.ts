import { textOf, type TagRowText } from '../tagRowText.ts'

/** What the wiki is asked about for a row: `key=value`, or `key` for a row without a text value. */
export function osmWikiReferenceOfRow(row: TagRowText) {
  const value =
    row.kind === 'changed' ? textOf(row.newValue, row.rawNew) : textOf(row.value, row.rawValue)
  return value ? `${row.key}=${value}` : row.key
}
