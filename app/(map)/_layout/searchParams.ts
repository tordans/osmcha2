import { createSearchParamsCache, parseAsJson, parseAsString } from 'nuqs/server'

// Docs: https://github.com/47ng/nuqs?tab=readme-ov-file#accessing-searchparams-in-server-components

export const searchParamsCache = createSearchParamsCache({
  // List your search param keys and associated parsers here:
  selected: parseAsString.withDefault(''),
  filters: parseAsJson<any>().withDefault({}),
})

// 'https://osmcha.org/changesets/152004580?filters={"checked_by":[{"label":"tordans","value":"tordans"}],"date__gte":[{"label":"","value":""}]}'
