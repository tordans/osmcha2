import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWikidataFacts } from './fetchWikidataFacts.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

const berlin = {
  id: 'Q64',
  labels: { en: { value: 'Berlin' }, de: { value: 'Berlin (de)' } },
  descriptions: { de: { value: 'Hauptstadt' } },
  aliases: { en: [{ value: 'Berlin, Germany' }] },
  claims: {
    P31: [
      { mainsnak: { datavalue: { value: { id: 'Q515' } } }, rank: 'normal' },
      { mainsnak: { datavalue: { value: { id: 'Q1' } } }, rank: 'deprecated' },
    ],
    P17: [{ mainsnak: { datavalue: { value: { id: 'Q183' } } } }],
    P856: [{ mainsnak: { datavalue: { value: 'https://berlin.de' } } }],
    P625: [{ mainsnak: { datavalue: { value: { latitude: 52.5, longitude: 13.4 } } } }],
    P18: [{ mainsnak: {} }],
  },
  sitelinks: { dewiki: { title: 'Berlin', url: 'https://de.wikipedia.org/wiki/Berlin' } },
}

function answer(...bodies: unknown[]) {
  const fetchMock = vi.fn()
  for (const body of bodies) fetchMock.mockResolvedValueOnce(Response.json(body))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('fetchWikidataFacts', () => {
  it('collects the facts and names the items they refer to', async () => {
    const fetchMock = answer(
      { entities: { Q64: berlin } },
      {
        entities: {
          Q515: { labels: { en: { value: 'city' } } },
          Q183: { labels: { de: { value: 'Deutschland' } } },
        },
      },
    )
    expect(await fetchWikidataFacts('Q64')).toEqual({
      id: 'Q64',
      missing: false,
      label: 'Berlin',
      description: 'Hauptstadt',
      aliases: ['Berlin, Germany'],
      instanceOf: ['city'],
      country: ['Deutschland'],
      locatedIn: [],
      operator: [],
      website: 'https://berlin.de',
      coordinates: { lat: 52.5, lng: 13.4 },
      wikipedia: { title: 'Berlin', url: 'https://de.wikipedia.org/wiki/Berlin' },
    })
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('origin=*')
  })

  it('keeps to what holds today', async () => {
    const claim = (id: string, rest: object) => ({
      mainsnak: { datavalue: { value: { id } } },
      ...rest,
    })
    answer(
      {
        entities: {
          Q1: {
            claims: {
              P17: [claim('Q2', {}), claim('Q3', { qualifiers: { P582: [{}] } })],
              P131: [claim('Q4', {}), claim('Q5', { rank: 'preferred' })],
            },
          },
        },
      },
      { entities: {} },
    )
    expect(await fetchWikidataFacts('Q1')).toMatchObject({ country: ['Q2'], locatedIn: ['Q5'] })
  })

  it('only links a website over http', async () => {
    answer({
      entities: {
        Q1: { claims: { P856: [{ mainsnak: { datavalue: { value: 'mailto:a@example.org' } } }] } },
      },
    })
    expect((await fetchWikidataFacts('Q1')).website).toBeNull()
  })

  it('keeps the id of a referred item without a name', async () => {
    answer({ entities: { Q64: berlin } }, { entities: {} })
    expect((await fetchWikidataFacts('Q64')).instanceOf).toEqual(['Q515'])
  })

  it('follows a redirect to the item it leads to', async () => {
    answer({ entities: { Q2: { id: 'Q3', labels: { en: { value: 'Merged' } } } } })
    expect(await fetchWikidataFacts('Q2')).toMatchObject({ id: 'Q3', label: 'Merged' })
  })

  it.each([
    ['a deleted item', { entities: { Q9: { id: 'Q9', missing: '' } } }],
    ['an unknown id', { error: { code: 'no-such-entity' } }],
  ])('reports %s as missing', async (_name, body) => {
    answer(body)
    expect(await fetchWikidataFacts('Q9')).toMatchObject({ id: 'Q9', missing: true })
  })

  it('fails on another error, so that nothing wrong is stored', async () => {
    answer({ error: { code: 'maxlag' } })
    await expect(fetchWikidataFacts('Q9')).rejects.toThrow('maxlag')
  })
})
