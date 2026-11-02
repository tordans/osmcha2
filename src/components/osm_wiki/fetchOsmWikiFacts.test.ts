import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchOsmWikiFacts, osmWikiUrl } from './fetchOsmWikiFacts.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

function answer(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(body))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const keyItem = {
  sitelinks: { wiki: { title: 'Key:bridge' } },
  descriptions: { en: { value: 'A bridge' } },
}
const tagItem = {
  sitelinks: { wiki: { title: 'Tag:bridge=viaduct' } },
  descriptions: { en: { value: 'A long bridge' } },
  claims: {
    P4: [{ rank: 'preferred', mainsnak: { datavalue: { value: 'Viaduct.jpg' } } }],
  },
}

describe('fetchOsmWikiFacts', () => {
  it('prefers the page of the tag and asks for both in one call', async () => {
    const fetchMock = answer({ entities: { Q1: keyItem, Q2: tagItem } })
    const facts = await fetchOsmWikiFacts('bridge=viaduct')
    expect(facts).toMatchObject({
      title: 'Tag:bridge=viaduct',
      description: 'A long bridge',
      itemId: 'Q2',
    })
    expect(facts.imageUrl).toContain('Viaduct.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get('titles')).toBe(
      'Tag:bridge=viaduct|Key:bridge',
    )
  })

  it('falls back to the page of the key', async () => {
    answer({ entities: { '-1': { missing: '' }, Q1: keyItem } })
    expect(await fetchOsmWikiFacts('bridge=yes-please')).toMatchObject({
      title: 'Key:bridge',
      description: 'A bridge',
      imageUrl: null,
    })
  })

  it.each(['turn:lanes=left|through', `description=${'x'.repeat(300)}`])(
    'only asks for the key of a value that cannot be a page',
    async (reference) => {
      const fetchMock = answer({ entities: {} })
      await fetchOsmWikiFacts(reference)
      const titles = new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get('titles')
      expect(titles?.startsWith('Key:')).toBe(true)
      expect(titles).not.toContain('|')
    },
  )

  it('says so when the wiki has neither', async () => {
    answer({ entities: { '-1': { missing: '' } } })
    expect(await fetchOsmWikiFacts('my_key')).toEqual({
      title: null,
      description: null,
      imageUrl: null,
      itemId: null,
    })
  })

  it('fails on an error answer, so that nothing wrong is stored', async () => {
    answer({ error: { code: 'maxlag' } })
    await expect(fetchOsmWikiFacts('bridge')).rejects.toThrow('maxlag')
  })
})

describe('osmWikiUrl', () => {
  it('escapes what would end the path', () => {
    expect(osmWikiUrl('Tag:a b=c&d')).toBe('https://wiki.openstreetmap.org/wiki/Tag:a_b=c%26d')
  })
})
