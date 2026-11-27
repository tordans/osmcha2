export type TagRow =
  | { kind: 'added'; key: string; value: string }
  | { kind: 'removed'; key: string; value: string }
  | { kind: 'changed'; key: string; oldValue: string; newValue: string }
  /** A removed and an added key with the same value, shown as one row. `key` is the new key. */
  | { kind: 'renamed'; oldKey: string; key: string; value: string }
  | { kind: 'unchanged'; key: string; value: string }

export function diffTags(
  oldRecord: Record<string, string>,
  newRecord: Record<string, string>,
): TagRow[] {
  // Maps, not plain objects: `in` would also match inherited keys such as "constructor".
  const oldTags = new Map(Object.entries(oldRecord))
  const newTags = new Map(Object.entries(newRecord))
  const rows: TagRow[] = []

  for (const [key, value] of newTags) {
    const oldValue = oldTags.get(key)
    if (oldValue === undefined) {
      rows.push({ kind: 'added', key, value })
    } else if (oldValue !== value) {
      rows.push({ kind: 'changed', key, oldValue, newValue: value })
    } else {
      rows.push({ kind: 'unchanged', key, value })
    }
  }

  for (const [key, value] of oldTags) {
    if (!newTags.has(key)) {
      rows.push({ kind: 'removed', key, value })
    }
  }

  return mergeKeyRenames(rows)
}

/** Share of matching letter pairs (Dice coefficient), 0 to 1. */
function keySimilarity(left: string, right: string): number {
  if (left === right) return 1
  if (left.length < 2 || right.length < 2) return 0
  const pairs = new Map<string, number>()
  for (let index = 0; index < left.length - 1; index++) {
    const pair = left.slice(index, index + 2)
    pairs.set(pair, (pairs.get(pair) ?? 0) + 1)
  }
  let shared = 0
  for (let index = 0; index < right.length - 1; index++) {
    const pair = right.slice(index, index + 2)
    const count = pairs.get(pair) ?? 0
    if (count > 0) {
      shared += 1
      pairs.set(pair, count - 1)
    }
  }
  return (2 * shared) / (left.length + right.length - 2)
}

/**
 * Merge a removed and an added tag with the identical value into one `renamed` row. With exactly
 * one of each for a value they always pair. With several, pairs go greedily by key similarity
 * (best first, ties by key) and need some similarity, so unrelated keys that merely share a value
 * such as "yes" stay added/removed. A tag whose value also changed is never a rename.
 */
function mergeKeyRenames(rows: TagRow[]): TagRow[] {
  const removedByValue = new Map<string, string[]>()
  const addedByValue = new Map<string, string[]>()
  for (const row of rows) {
    if (row.kind !== 'removed' && row.kind !== 'added') continue
    const byValue = row.kind === 'removed' ? removedByValue : addedByValue
    const keys = byValue.get(row.value)
    if (keys) keys.push(row.key)
    else byValue.set(row.value, [row.key])
  }

  const renamedTo = new Map<string, string>() // new key -> old key
  const renamedFrom = new Set<string>() // old keys that were merged
  for (const [value, removedKeys] of removedByValue) {
    const addedKeys = addedByValue.get(value)
    if (!addedKeys) continue
    if (removedKeys.length === 1 && addedKeys.length === 1) {
      const [oldKey] = removedKeys
      const [newKey] = addedKeys
      if (oldKey !== undefined && newKey !== undefined) {
        renamedTo.set(newKey, oldKey)
        renamedFrom.add(oldKey)
      }
      continue
    }
    const candidates = removedKeys
      .flatMap((oldKey) =>
        addedKeys.map((newKey) => ({ oldKey, newKey, score: keySimilarity(oldKey, newKey) })),
      )
      .filter((candidate) => candidate.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          compareKeys(left.newKey, right.newKey) ||
          compareKeys(left.oldKey, right.oldKey),
      )
    for (const { oldKey, newKey } of candidates) {
      if (renamedFrom.has(oldKey) || renamedTo.has(newKey)) continue
      renamedTo.set(newKey, oldKey)
      renamedFrom.add(oldKey)
    }
  }
  if (renamedTo.size === 0) return rows

  return rows.flatMap((row): TagRow[] => {
    if (row.kind === 'removed' && renamedFrom.has(row.key)) return []
    const oldKey = row.kind === 'added' ? renamedTo.get(row.key) : undefined
    if (row.kind === 'added' && oldKey !== undefined) {
      return [{ kind: 'renamed', oldKey, key: row.key, value: row.value }]
    }
    return [row]
  })
}

/** Plain code point order, so the result does not depend on the locale. */
function compareKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

const MUTATION_KIND_ORDER = ['renamed', 'changed', 'added', 'removed'] as const

/**
 * Tag rows for display: the rows with a change first (renamed, changed, added, removed; by key
 * within each), then the unchanged rows by key.
 */
export function orderTagRows<T extends { kind: TagRow['kind']; key: string }>(
  rows: T[],
): { mutations: T[]; unchanged: T[] } {
  const rank = (row: T) =>
    MUTATION_KIND_ORDER.indexOf(row.kind as (typeof MUTATION_KIND_ORDER)[number])
  return {
    mutations: rows
      .filter((row) => row.kind !== 'unchanged')
      .sort((left, right) => rank(left) - rank(right) || compareKeys(left.key, right.key)),
    unchanged: rows
      .filter((row) => row.kind === 'unchanged')
      .sort((left, right) => compareKeys(left.key, right.key)),
  }
}

/** Keys a row stands for: a renamed row also answers to the key it had before. */
export function tagRowKeys(row: { key: string; oldKey?: string }): string[] {
  return row.oldKey === undefined ? [row.key] : [row.key, row.oldKey]
}
