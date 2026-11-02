import { fetchOsmWikiFacts, osmWikiFactsSchema } from '../components/osm_wiki/fetchOsmWikiFacts.ts'
import { createFetchedFactsStore, FETCHED_FACTS_MAX_AGE_MS } from './fetched-facts-store.ts'

const { useEntry, useStatus, useActions } = createFetchedFactsStore({
  name: 'osm-wiki-facts',
  maxAgeMs: FETCHED_FACTS_MAX_AGE_MS,
  factsSchema: osmWikiFactsSchema,
  fetchFacts: fetchOsmWikiFacts,
})

export const useOsmWikiEntry = useEntry
export const useOsmWikiStatus = useStatus
export const useOsmWikiActions = useActions
