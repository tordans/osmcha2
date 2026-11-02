import { useState } from 'react'
import {
  useOsmWikiActions,
  useOsmWikiEntry,
  useOsmWikiStatus,
} from '../../stores/osm-wiki-store.ts'
import { ExternalLink, TagInfoButton, TagInfoCard, TagInfoList } from '../tag_info/TagInfoParts.tsx'
import { InformationCircleIcon } from '../ui/icons.ts'
import { osmWikiUrl, type OsmWikiFacts } from './fetchOsmWikiFacts.ts'

/** The mini button of a row without Wikidata items. */
export function OsmWikiButton({ reference }: { reference: string }) {
  const entry = useOsmWikiEntry(reference)
  const status = useOsmWikiStatus(reference)
  const { load, setOpen } = useOsmWikiActions()
  return (
    <TagInfoButton
      name={`OSM Wiki about ${reference}`}
      icon={<InformationCircleIcon className="size-3.5" aria-hidden />}
      entry={entry}
      loading={!entry && status === 'loading'}
      hoverOnly
      onLoad={() => void load(reference)}
      onToggle={(open) => setOpen(reference, open)}
    />
  )
}

function OsmWikiCardBody({ facts }: { facts: OsmWikiFacts }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (facts.title == null) return <p className="text-zinc-600">The OSM Wiki has no page for this</p>
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-mono font-medium break-all text-zinc-950">
          {facts.title.replace(/^(Key|Tag):/, '')}
        </p>
        {facts.description ? <p className="mt-0.5 text-zinc-700">{facts.description}</p> : null}
        <p className="mt-0.5 flex gap-2 text-zinc-800">
          <ExternalLink href={osmWikiUrl(facts.title)}>OSM Wiki</ExternalLink>
          {facts.itemId ? (
            <ExternalLink href={osmWikiUrl(`Item:${facts.itemId}`)}>Data item</ExternalLink>
          ) : null}
        </p>
      </div>
      {facts.imageUrl && !imageFailed ? (
        <img
          src={facts.imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="max-h-20 w-24 flex-none rounded bg-zinc-950/5 object-contain"
        />
      ) : null}
    </div>
  )
}

/** What the OSM Wiki says about a tag, below its row, to check that the tag makes sense there. */
export function OsmWikiRowData({ reference }: { reference: string }) {
  const entry = useOsmWikiEntry(reference)
  const status = useOsmWikiStatus(reference)
  const { load } = useOsmWikiActions()

  return (
    <TagInfoList label="OSM Wiki about this tag">
      {entry?.open ? (
        <li className="w-full min-w-0">
          <TagInfoCard
            fetchedAt={entry.fetchedAt}
            reloadLabel={`Load ${reference} again from the OSM Wiki`}
            reloading={status === 'loading'}
            failed={status === 'failed'}
            onReload={() => void load(reference)}
          >
            <OsmWikiCardBody facts={entry.facts} />
          </TagInfoCard>
        </li>
      ) : null}
      {!entry && status === 'failed' ? (
        <li className="text-red-700">Could not load the OSM Wiki</li>
      ) : null}
    </TagInfoList>
  )
}
