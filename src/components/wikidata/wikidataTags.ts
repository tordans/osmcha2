import { textOf, type TagRowText } from '../tagRowText.ts'

/** A Wikidata item in a tag value. `old`: of the old value of a change, or of a removed row. */
export type WikidataRowItem = { id: string; old: boolean }

const WIKIDATA_ID = /^Q[1-9]\d*$/

/** `wikidata`, `brand:wikidata`, `name:etymology:wikidata`, `subject:wikidata`: any part counts. */
function holdsWikidataIds(key: string) {
  return key.split(':').includes('wikidata')
}

function idsOfValue(value: string | undefined) {
  if (value == null) return []
  const ids = value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => WIKIDATA_ID.test(part))
  return [...new Set(ids)]
}

/** The Wikidata items in a tag row, without doubles. Other keys have none. */
export function wikidataItemsOfRow(row: TagRowText): WikidataRowItem[] {
  if (!holdsWikidataIds(row.key)) return []

  if (row.kind === 'changed') {
    const current = idsOfValue(textOf(row.newValue, row.rawNew))
    const dropped = idsOfValue(textOf(row.oldValue, row.rawOld)).filter(
      (id) => !current.includes(id),
    )
    return [
      ...current.map((id) => ({ id, old: false })),
      ...dropped.map((id) => ({ id, old: true })),
    ]
  }
  const old = row.kind === 'removed'
  return idsOfValue(textOf(row.value, row.rawValue)).map((id) => ({ id, old }))
}

/** A distance for people: `80 m`, `1.2 km`, `340 km`. */
export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`
  const kilometers = meters / 1000
  return `${kilometers < 10 ? kilometers.toFixed(1) : Math.round(kilometers)} km`
}
