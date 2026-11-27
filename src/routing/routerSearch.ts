import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'

const parseSearch = parseSearchWith(JSON.parse)

/** Integers that `JSON.parse` returns exactly as written; the app turns the number back into the same string. */
const SAFE_INTEGER_STRING = /^(0|[1-9]\d{0,14})$/

/**
 * Strings that `JSON.parse` would read as something else (`2.30`, `1e3`, `null`, `-0`, `"quoted"`,
 * ids beyond 2^53) get quoted so they come back unchanged. Plain digit strings stay unquoted to keep
 * URLs like `uids=11881` readable.
 */
const stringifyValue = (value: unknown) =>
  typeof value === 'string' && SAFE_INTEGER_STRING.test(value) ? value : JSON.stringify(value)

const stringifySearchDefault = stringifySearchWith(stringifyValue, JSON.parse)

/** Decode safe query-value characters after default stringify. */
const makeSearchPretty = (searchString: string) =>
  searchString
    .replaceAll('%22', '"')
    .replaceAll('%2C', ',')
    .replaceAll('%27', "'")
    .replaceAll('%28', '(')
    .replaceAll('%29', ')')
    .replaceAll('%3A', ':')
    .replaceAll('%3B', ';')
    .replaceAll('%5B', '[')
    .replaceAll('%5D', ']')
    .replaceAll('%7B', '{')
    .replaceAll('%7D', '}')
    .replaceAll('%2F', '/')

export const routerSearch = {
  parse: parseSearch,
  stringify: (search: Record<string, unknown>) => makeSearchPretty(stringifySearchDefault(search)),
}
