import {
  fetchWikidataFacts,
  wikidataFactsSchema,
  type WikidataFacts,
} from '../components/wikidata/fetchWikidataFacts.ts'
import {
  createFetchedFactsStore,
  FETCHED_FACTS_MAX_AGE_MS,
  type FetchedEntry,
} from './fetched-facts-store.ts'

export type WikidataEntry = FetchedEntry<WikidataFacts>

const { useEntry, useStatus, useActions } = createFetchedFactsStore({
  name: 'wikidata-facts',
  maxAgeMs: FETCHED_FACTS_MAX_AGE_MS,
  factsSchema: wikidataFactsSchema,
  fetchFacts: fetchWikidataFacts,
})

export const useWikidataEntry = useEntry
export const useWikidataStatus = useStatus
export const useWikidataActions = useActions
