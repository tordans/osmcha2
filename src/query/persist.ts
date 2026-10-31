import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { defaultShouldDehydrateQuery, type Query } from '@tanstack/react-query'
import { del, get, set } from 'idb-keyval'
import { STREET_IMAGERY_PACKAGE_QUERY_KEYS } from '../components/street_imagery/streetImageryLayerSettings.ts'
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
 * build, which change with every deploy), the street-level photos (the package's per-viewport
 * lists are large and age fast; a photo's own data is cheap to load again) and the surroundings,
 * which keep their own store with a shorter life.
 */
const NOT_PERSISTED_QUERY_KEYS = new Set<string>([
  'changesetMap',
  'trafficSigns',
  ...STREET_IMAGERY_PACKAGE_QUERY_KEYS,
  'streetImageryPhoto',
  'surroundings',
])

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
