import { z } from 'zod'

const API_URL = 'https://www.wikidata.org/w/api.php'

/** The first of these an item has names it. `mul` is Wikidata's label for all languages. */
const LANGUAGES = ['mul', 'en', 'de', 'fr', 'es']
const WIKIPEDIAS = ['enwiki', 'dewiki']
const MAX_ALIASES = 5
/** Wikimedia's etiquette: the server refuses while it lags this many seconds. */
const MAXLAG_SECONDS = 5

const INSTANCE_OF = 'P31'
const COUNTRY = 'P17'
const LOCATED_IN = 'P131'
const OPERATOR = 'P137'
const WEBSITE = 'P856'
const COORDINATES = 'P625'
const END_TIME = 'P582'

export const wikidataFactsSchema = z.object({
  /** The item the id leads to; another one than asked for when Wikidata redirects it. */
  id: z.string(),
  missing: z.boolean(),
  label: z.string().nullable(),
  description: z.string().nullable(),
  aliases: z.array(z.string()),
  instanceOf: z.array(z.string()),
  country: z.array(z.string()),
  locatedIn: z.array(z.string()),
  operator: z.array(z.string()),
  website: z.string().nullable(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  wikipedia: z.object({ title: z.string(), url: z.string() }).nullable(),
})

export type WikidataFacts = z.infer<typeof wikidataFactsSchema>

const textsSchema = z.record(z.string(), z.object({ value: z.string() })).catch({})

const claimSchema = z.object({
  mainsnak: z.object({
    datavalue: z.object({ value: z.unknown() }).optional(),
  }),
  rank: z.string().optional(),
  qualifiers: z.record(z.string(), z.unknown()).optional(),
})

const entitySchema = z.object({
  id: z.string().optional(),
  missing: z.string().optional(),
  labels: textsSchema.optional(),
  descriptions: textsSchema.optional(),
  aliases: z
    .record(z.string(), z.array(z.object({ value: z.string() })))
    .catch({})
    .optional(),
  claims: z.record(z.string(), z.array(claimSchema)).catch({}).optional(),
  sitelinks: z
    .record(z.string(), z.object({ title: z.string(), url: z.string().optional() }))
    .catch({})
    .optional(),
})

const responseSchema = z.object({
  entities: z.record(z.string(), entitySchema).optional(),
  error: z.object({ code: z.string() }).optional(),
})

type Entity = z.infer<typeof entitySchema>

const itemValueSchema = z.object({ id: z.string() })
const coordinateValueSchema = z.object({ latitude: z.number(), longitude: z.number() })

function firstText(texts: Entity['labels']) {
  for (const language of LANGUAGES) {
    const value = texts?.[language]?.value
    if (value) return value
  }
  return null
}

/**
 * What holds today: Wikidata's preferred values when it marks some, without those it marks as wrong
 * or that have ended. Berlin was in many countries.
 */
function claimValues(entity: Entity, property: string) {
  const current = (entity.claims?.[property] ?? []).filter(
    (claim) => claim.rank !== 'deprecated' && claim.qualifiers?.[END_TIME] == null,
  )
  const preferred = current.filter((claim) => claim.rank === 'preferred')
  return (preferred.length > 0 ? preferred : current).map(
    (claim) => claim.mainsnak.datavalue?.value,
  )
}

function itemIds(entity: Entity, property: string) {
  return claimValues(entity, property).flatMap((value) => {
    const item = itemValueSchema.safeParse(value)
    return item.success ? [item.data.id] : []
  })
}

async function fetchEntities(ids: string[], props: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: ids.join('|'),
    props,
    languages: LANGUAGES.join('|'),
    sitefilter: WIKIPEDIAS.join('|'),
    maxlag: String(MAXLAG_SECONDS),
    format: 'json',
    origin: '*',
  })
  const response = await fetch(`${API_URL}?${params}`, { signal })
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}`)
  return responseSchema.parse(await response.json())
}

function missingFacts(id: string): WikidataFacts {
  return {
    id,
    missing: true,
    label: null,
    description: null,
    aliases: [],
    instanceOf: [],
    country: [],
    locatedIn: [],
    operator: [],
    website: null,
    coordinates: null,
    wikipedia: null,
  }
}

/**
 * What of a Wikidata item helps to check the tags next to it: its names, what it is, where it is
 * and its links. A second request names the items it refers to.
 */
export async function fetchWikidataFacts(id: string, signal?: AbortSignal): Promise<WikidataFacts> {
  const { entities, error } = await fetchEntities(
    [id],
    'labels|descriptions|aliases|claims|sitelinks/urls',
    signal,
  )
  if (error?.code === 'no-such-entity') return missingFacts(id)
  if (error) throw new Error(`Wikidata answered ${error.code}`)
  // A redirected id comes back under the item it leads to.
  const entity = Object.values(entities ?? {})[0]
  if (!entity || entity.missing != null) return missingFacts(id)

  const referred = {
    instanceOf: itemIds(entity, INSTANCE_OF),
    country: itemIds(entity, COUNTRY),
    locatedIn: itemIds(entity, LOCATED_IN),
    operator: itemIds(entity, OPERATOR),
  }
  const referredIds = [...new Set(Object.values(referred).flat())].slice(0, 50)
  const names =
    referredIds.length > 0
      ? (await fetchEntities(referredIds, 'labels', signal)).entities
      : undefined
  const namesOf = (ids: string[]) => [
    ...new Set(ids.map((item) => firstText(names?.[item]?.labels) ?? item)),
  ]

  // A third party's text that ends up in a link.
  const website = claimValues(entity, WEBSITE).find(
    (value) => typeof value === 'string' && /^https?:\/\//i.test(value),
  )
  const coordinate = coordinateValueSchema.safeParse(claimValues(entity, COORDINATES)[0])
  const site = WIKIPEDIAS.map((name) => entity.sitelinks?.[name]).find((link) => link?.url)
  const aliases = LANGUAGES.flatMap((language) => entity.aliases?.[language] ?? []).map(
    (alias) => alias.value,
  )

  return {
    id: entity.id ?? id,
    missing: false,
    label: firstText(entity.labels),
    description: firstText(entity.descriptions),
    aliases: [...new Set(aliases)].slice(0, MAX_ALIASES),
    instanceOf: namesOf(referred.instanceOf),
    country: namesOf(referred.country),
    locatedIn: namesOf(referred.locatedIn),
    operator: namesOf(referred.operator),
    website: typeof website === 'string' ? website : null,
    coordinates: coordinate.success
      ? { lat: coordinate.data.latitude, lng: coordinate.data.longitude }
      : null,
    wikipedia: site?.url ? { title: site.title, url: site.url } : null,
  }
}
