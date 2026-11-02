import { z } from 'zod'

const API_URL = 'https://wiki.openstreetmap.org/w/api.php'
const COMMONS_FILES = 'https://commons.wikimedia.org/w/index.php'
const WIKI_FILES = 'https://wiki.openstreetmap.org/w/index.php'
const LANGUAGE = 'en'
const IMAGE_WIDTH = 400
/** Wikimedia's etiquette: the server refuses while it lags this many seconds. */
const MAXLAG_SECONDS = 5
const MAX_TITLE_LENGTH = 200

const COMMONS_IMAGE = 'P4'
const WIKI_IMAGE = 'P28'

export const osmWikiFactsSchema = z.object({
  /** The page the facts are from: the tag's, else the key's. Null when the wiki has neither. */
  title: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  /** The wiki's data item, like `Q123`. */
  itemId: z.string().nullable(),
})

export type OsmWikiFacts = z.infer<typeof osmWikiFactsSchema>

const optionalText = z.string().optional().catch(undefined)

const statementSchema = z.object({
  rank: optionalText,
  mainsnak: z
    .object({ datavalue: z.object({ value: z.unknown() }).optional().catch(undefined) })
    .optional()
    .catch(undefined),
})

const itemSchema = z.object({
  missing: optionalText,
  sitelinks: z
    .object({ wiki: z.object({ title: optionalText }).optional().catch(undefined) })
    .optional()
    .catch(undefined),
  descriptions: z
    .record(z.string(), z.object({ value: optionalText }).optional().catch(undefined))
    .optional()
    .catch(undefined),
  claims: z.record(z.string(), z.array(statementSchema).catch([])).optional().catch(undefined),
})

const answerSchema = z.object({
  error: z.object({ code: optionalText }).optional().catch({ code: undefined }),
  entities: z
    .record(z.string(), itemSchema.optional().catch(undefined))
    .optional()
    .catch(undefined),
})

type Item = z.infer<typeof itemSchema>

/** The wiki's page name: `Key:<key>` or `Tag:<key>=<value>`, with `_` read as a space. */
function wikiTitle(prefix: 'Key' | 'Tag', text: string) {
  return `${prefix}:${text}`.replaceAll('_', ' ').trim()
}

function preferredText(item: Item, property: string) {
  const statement = item.claims?.[property]?.find((found) => found.rank === 'preferred')
  const value = statement?.mainsnak?.datavalue?.value
  return typeof value === 'string' ? value : undefined
}

function fileUrl(base: string, file: string) {
  const query = new URLSearchParams({
    title: `Special:Redirect/file/${file}`,
    width: String(IMAGE_WIDTH),
  })
  return `${base}?${query}`
}

function imageOf(item: Item) {
  const commons = preferredText(item, COMMONS_IMAGE)
  if (commons) return fileUrl(COMMONS_FILES, commons)
  const onWiki = preferredText(item, WIKI_IMAGE)
  return onWiki ? fileUrl(WIKI_FILES, onWiki) : null
}

/** `|` separates titles in a request, the others cannot be in one; long ones are free text. */
function canBeWikiTitle(title: string) {
  return title.length <= MAX_TITLE_LENGTH && !/[|<>[\]{}#]/.test(title)
}

/** The URL of a wiki page. */
export function osmWikiUrl(title: string) {
  const path = encodeURI(title.replaceAll(' ', '_')).replace(/[#?&]/g, encodeURIComponent)
  return `https://wiki.openstreetmap.org/wiki/${path}`
}

/**
 * The wiki's documentation of `key` or `key=value`, as MAID and iD read it: the tag's page, else the
 * key's. Asked in one call.
 */
export async function fetchOsmWikiFacts(
  reference: string,
  signal?: AbortSignal,
): Promise<OsmWikiFacts> {
  const separator = reference.indexOf('=')
  const key = separator < 0 ? reference : reference.slice(0, separator)
  const keyTitle = wikiTitle('Key', key)
  const tagTitle = separator < 0 ? null : wikiTitle('Tag', reference)
  const titles = tagTitle && canBeWikiTitle(tagTitle) ? [tagTitle, keyTitle] : [keyTitle]

  const query = new URLSearchParams({
    action: 'wbgetentities',
    sites: 'wiki',
    titles: titles.join('|'),
    languages: LANGUAGE,
    languagefallback: '1',
    maxlag: String(MAXLAG_SECONDS),
    origin: '*',
    format: 'json',
  })
  const response = await fetch(`${API_URL}?${query}`, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error(`The OSM Wiki answered ${response.status}`)
  const { entities, error } = answerSchema.parse(await response.json())
  if (error) throw new Error(`The OSM Wiki answered ${error.code ?? 'with an error'}`)

  const found = Object.entries(entities ?? {}).flatMap(([id, item]) =>
    item && item.missing == null && item.sitelinks?.wiki?.title
      ? [{ id, item, title: item.sitelinks.wiki.title }]
      : [],
  )
  for (const title of titles) {
    const page = found.find((candidate) => candidate.title === title)
    if (!page) continue
    return {
      title,
      description: page.item.descriptions?.[LANGUAGE]?.value ?? null,
      imageUrl: imageOf(page.item),
      itemId: /^Q\d+$/.test(page.id) ? page.id : null,
    }
  }
  return { title: null, description: null, imageUrl: null, itemId: null }
}
