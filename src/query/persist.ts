import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { defaultShouldDehydrateQuery, type Query } from '@tanstack/react-query'
import { del, get, set } from 'idb-keyval'
import { PERSIST_MAX_AGE_MS } from './cachePolicy.ts'

const PERSIST_KEY = 'osmcha-query-cache'

const queryPersister = createAsyncStoragePersister({
  key: PERSIST_KEY,
  storage: {
    getItem: async (key) => (await get<string>(key)) ?? null,
    setItem: async (key, value) => {
      await set(key, value)
    },
    removeItem: async (key) => {
      await del(key)
    },
  },
})

/**
 * Not persisted: the changeset map (parsed trees are large), the sign results (asset URLs of this
 * build, which change with every deploy) and the street-level photo data (cheap to load again).
 */
const NOT_PERSISTED_QUERY_KEYS = new Set(['changesetMap', 'trafficSigns', 'streetImageryPhoto'])

function shouldPersistQuery(query: Query) {
  const notPersisted = NOT_PERSISTED_QUERY_KEYS.has(String(query.queryKey[0]))
  return !notPersisted && defaultShouldDehydrateQuery(query)
}

export const persistQueryOptions = {
  persister: queryPersister,
  maxAge: PERSIST_MAX_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: shouldPersistQuery,
  },
}
