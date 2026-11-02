import type { ReactNode } from 'react'
import wikidataIconUrl from '../../assets/wikidata-icon.svg'
import type { LonLat as ObjectLocation } from '../../presets/types.ts'
import {
  useWikidataActions,
  useWikidataEntry,
  useWikidataStatus,
  type WikidataEntry,
} from '../../stores/wikidata-store.ts'
import { distanceMeters } from '../changeset/changeGroupClusters.ts'
import { ExternalLink, TagInfoButton, TagInfoCard, TagInfoList } from '../tag_info/TagInfoParts.tsx'
import type { WikidataFacts } from './fetchWikidataFacts.ts'
import { formatDistance, type WikidataRowItem } from './wikidataTags.ts'

function Fact({ name, children }: { name: string; children: ReactNode }) {
  return (
    <>
      <span className="text-zinc-500">{name}</span>
      <span className="min-w-0 break-words text-zinc-800">{children}</span>
    </>
  )
}

function ListFact({ name, values }: { name: string; values: string[] }) {
  if (values.length === 0) return null
  return <Fact name={name}>{values.join(', ')}</Fact>
}

function WikidataFactList({
  facts,
  location,
}: {
  facts: WikidataFacts
  location?: ObjectLocation
}) {
  const { coordinates, website, wikipedia } = facts
  return (
    <div className="mt-0.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
      <ListFact name="Also" values={facts.aliases} />
      <ListFact name="Is a" values={facts.instanceOf} />
      <ListFact name="Operator" values={facts.operator} />
      <ListFact name="In" values={facts.locatedIn} />
      <ListFact name="Country" values={facts.country} />
      {website ? (
        <Fact name="Website">
          <ExternalLink href={website}>{website}</ExternalLink>
        </Fact>
      ) : null}
      {wikipedia ? (
        <Fact name="Wikipedia">
          <ExternalLink href={wikipedia.url}>{wikipedia.title}</ExternalLink>
        </Fact>
      ) : null}
      {coordinates ? (
        <Fact name="Location">
          <ExternalLink
            href={`https://www.openstreetmap.org/#map=17/${coordinates.lat}/${coordinates.lng}`}
          >
            {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
          </ExternalLink>
          {location ? (
            <span className="text-[10px] text-zinc-500">
              {' '}
              {formatDistance(
                distanceMeters(
                  { lon: location[0], lat: location[1] },
                  { lat: coordinates.lat, lon: coordinates.lng },
                ),
              )}{' '}
              from the object
            </span>
          ) : null}
        </Fact>
      ) : null}
    </div>
  )
}

function WikidataCard({
  id,
  entry,
  old,
  location,
}: {
  id: string
  entry: WikidataEntry
  old: boolean
  location?: ObjectLocation
}) {
  const { facts, fetchedAt } = entry
  const status = useWikidataStatus(id)
  const { load } = useWikidataActions()
  return (
    <TagInfoCard
      fetchedAt={fetchedAt}
      reloadLabel={`Load ${id} again from Wikidata`}
      reloading={status === 'loading'}
      failed={status === 'failed'}
      dim={old}
      onReload={() => void load(id)}
    >
      <p className="leading-tight text-zinc-950">
        {facts.missing ? (
          <>Wikidata has no item {id}</>
        ) : (
          <>
            <span className="font-medium">{facts.label ?? id}</span>
            {old ? <span className="text-zinc-500"> (old)</span> : null}
            {facts.description ? (
              <span className="text-zinc-600"> – {facts.description}</span>
            ) : null}
          </>
        )}
      </p>
      {facts.id !== id ? (
        <p className="text-zinc-600">
          {id} redirects to{' '}
          <ExternalLink href={`https://www.wikidata.org/entity/${facts.id}`}>
            {facts.id}
          </ExternalLink>
        </p>
      ) : null}
      {facts.missing ? null : <WikidataFactList facts={facts} location={location} />}
    </TagInfoCard>
  )
}

function WikidataButton({ id, old }: WikidataRowItem) {
  const entry = useWikidataEntry(id)
  const status = useWikidataStatus(id)
  const { load, setOpen } = useWikidataActions()
  return (
    <TagInfoButton
      name={`Wikidata ${id}${old ? ' (old value)' : ''}`}
      icon={<img src={wikidataIconUrl} alt="" className="size-3.5" />}
      entry={entry}
      loading={!entry && status === 'loading'}
      dim={old}
      onLoad={() => void load(id)}
      onToggle={(open) => setOpen(id, open)}
    />
  )
}

/** One mini button per Wikidata item, next to the value. */
export function WikidataButtons({ items }: { items: WikidataRowItem[] }) {
  return items.map((item) => <WikidataButton key={`${item.id}:${item.old}`} {...item} />)
}

function WikidataItem({
  id,
  old,
  location,
}: WikidataRowItem & {
  location?: ObjectLocation
}) {
  const entry = useWikidataEntry(id)
  const status = useWikidataStatus(id)
  if (entry) {
    return entry.open ? (
      <li className="w-full min-w-0">
        <WikidataCard id={id} entry={entry} old={old} location={location} />
      </li>
    ) : null
  }
  return status === 'failed' ? <li className="text-red-700">Could not load {id}</li> : null
}

/** What Wikidata says about the items in a tag value, below the row, to compare with the other tags. */
export function WikidataRowData({
  items,
  location,
}: {
  items: WikidataRowItem[]
  location?: ObjectLocation
}) {
  return (
    <TagInfoList label="Wikidata items in this value">
      {items.map((item) => (
        <WikidataItem key={`${item.id}:${item.old}`} {...item} location={location} />
      ))}
    </TagInfoList>
  )
}
