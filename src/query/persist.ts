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

function shouldPersistQuery(query: Query) {
  return query.queryKey[0] !== 'changesetMap' && defaultShouldDehydrateQuery(query)
}

export const persistQueryOptions = {
  persister: queryPersister,
  maxAge: PERSIST_MAX_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: shouldPersistQuery,
  },
}
