import clsx from 'clsx'
import { Fragment } from 'react'
import { Badge } from '../ui/badge.tsx'
import { ArrowsLeftRightIcon, ArrowTopRightOnSquareIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { typeScale } from '../ui/typography.ts'
import { ACTION } from './actionColors.ts'
import { ActionIcon } from './ActionTypeLabel.tsx'
import type {
  ElementChange,
  MemberChanges,
  MemberRoleChange,
  NodeStats,
} from './changesetElements.ts'
import { elementOsmUrl } from './elementOpenIn.ts'
import { minorMoveLabel } from './minorMoves.ts'

export function MinorMoveBadge({
  minorMove,
}: {
  minorMove: NonNullable<ElementChange['minorMove']>
}) {
  return (
    <Tooltip
      as="span"
      placement="bottom-end"
      content={
        minorMove.meters != null
          ? 'A minor move: counts as seen automatically.'
          : 'Only forward/backward roles of ways reversed in this changeset swapped, as editors do when reversing a way: counts as seen automatically.'
      }
      className="inline-flex"
    >
      <Badge>{minorMoveLabel(minorMove)}</Badge>
    </Tooltip>
  )
}

/** `way/<id>` links that select that way, like clicking its row. */
export function WayLinks({ ids, onSelect }: { ids: number[]; onSelect: (id: number) => void }) {
  return ids.map((id, index) => (
    <Fragment key={id}>
      {index > 0 ? ', ' : null}
      <button
        type="button"
        aria-label={`Show way/${id} on map`}
        className="relative cursor-pointer touch-manipulation underline decoration-dotted underline-offset-2 select-none after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-[''] active:opacity-60"
        onClick={(event) => {
          event.stopPropagation()
          onSelect(id)
        }}
      >
        way/{id}
      </button>
    </Fragment>
  ))
}

export function nodeStatsAriaLabel(stats: NodeStats) {
  if (Object.values(stats).every((value) => value === 0)) {
    return 'Only tagging was changed; no changes to the geometry were made.'
  }
  return [
    'Changes to this way:',
    `${stats.added} nodes added`,
    `${stats.modified} nodes modified`,
    `${stats.deleted} nodes deleted`,
  ].join(' ')
}

export function NodeStatsTooltip({ stats }: { stats: NodeStats }) {
  if (Object.values(stats).every((value) => value === 0)) {
    return 'Only tagging was changed; no changes to the geometry were made.'
  }
  return (
    <div className="flex flex-col gap-0.5">
      <p>Changes to this way:</p>
      <p className="flex items-center gap-1">
        <span style={{ color: ACTION.create.hex }}>
          <ActionIcon action="create" className="size-3" />
        </span>
        {stats.added} nodes added
      </p>
      <p className="flex items-center gap-1">
        <span style={{ color: ACTION.modify.hex }}>
          <ActionIcon action="modify" className="size-3" />
        </span>
        {stats.modified} nodes modified
      </p>
      <p className="flex items-center gap-1">
        <span style={{ color: ACTION.delete.hex }}>
          <ActionIcon action="delete" className="size-3" />
        </span>
        {stats.deleted} nodes deleted
      </p>
    </div>
  )
}

/** "way/123" as a link to the object on osm.org, for inspecting it there. */
export function OsmElementLink({
  type,
  id,
  iconOnly,
}: {
  type: string
  id: number | string
  /** Collapsed rows: the id stays plain text, a small icon next to it carries the link. */
  iconOnly?: boolean
}) {
  if (iconOnly) {
    return (
      <a
        href={elementOsmUrl(type, id)}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open ${type}/${id} on openstreetmap.org`}
        aria-label={`Open ${type}/${id} on openstreetmap.org`}
        className="ml-1 inline-flex shrink-0 rounded align-middle text-zinc-500 hover:text-zinc-950 focus-visible:text-zinc-950"
        onClick={(event) => event.stopPropagation()}
      >
        <ArrowTopRightOnSquareIcon className="size-3.5" />
      </a>
    )
  }
  return (
    <a
      href={elementOsmUrl(type, id)}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${type}/${id} on openstreetmap.org`}
      className="hover:underline focus-visible:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {type}/{id}
    </a>
  )
}

const REVERSED_HINT = 'Check direction-dependent tags such as oneway, :forward and :backward.'

/** "Shortened", "Extended", "Reshaped" or "Reversed"; a reversal next to another change adds an icon. */
export function GeometryRewrittenBadge({ change }: { change: ElementChange }) {
  const { splitInto, mergedFrom, reversed } = change
  // A split keeps the original id on one part, which therefore lost nodes.
  const shapeText = splitInto
    ? `This way was split. It keeps its id and history; the cut-off part is now ${splitInto.map((id) => `way/${id}`).join(', ')}.`
    : mergedFrom
      ? `Other ways were merged into this one. It keeps its id and history; ${mergedFrom.map((id) => `way/${id}`).join(', ')} are now part of it and were deleted.`
      : 'This way’s nodes changed (added, removed, or reordered), so its shape changed.'
  const onlyReversed = reversed && !reversed.reshaped && !splitInto && !mergedFrom
  const label = onlyReversed
    ? 'Reversed'
    : splitInto
      ? 'Shortened'
      : mergedFrom
        ? 'Extended'
        : 'Reshaped'
  const content = onlyReversed
    ? `This way’s direction was reversed; it has the same nodes in the opposite order. ${REVERSED_HINT}`
    : reversed
      ? `${shapeText} Its direction was also reversed. ${REVERSED_HINT}`
      : shapeText
  return (
    <Tooltip as="span" placement="bottom-end" content={content} className="inline-flex">
      <Badge color="yellow">
        {reversed ? (
          <ArrowsLeftRightIcon
            {...(onlyReversed
              ? { 'aria-hidden': true }
              : { role: 'img', 'aria-label': 'Reversed' })}
            className="size-3.5"
          />
        ) : null}
        {label}
      </Badge>
    </Tooltip>
  )
}

function roleName(role: string) {
  return role === '' ? 'no role' : role
}

/** Role changes grouped by from → to, so "forward → backward" lists its ways once. */
function roleChangeGroups(roles: MemberRoleChange[]) {
  const groups = new Map<string, MemberRoleChange[]>()
  for (const role of roles) {
    const key = `${role.from}\u0000${role.to}`
    const group = groups.get(key)
    if (group) group.push(role)
    else groups.set(key, [role])
  }
  return [...groups.entries()]
}

export function memberChangeLineCount(changes: MemberChanges | undefined) {
  if (!changes) return 0
  return (
    roleChangeGroups(changes.roles).length +
    (changes.added > 0 ? 1 : 0) +
    (changes.removed > 0 ? 1 : 0) +
    (changes.reordered ? 1 : 0)
  )
}

/** What changed in a relation's member list; the tags alone would not say why it is listed. */
export function MemberChangeLines({
  changes,
  onSelectWay,
}: {
  changes: MemberChanges
  onSelectWay: (id: number) => void
}) {
  const plural = (count: number) => (count === 1 ? 'member' : 'members')
  return (
    <div className={clsx(typeScale.small, ACTION.modify.tagText)}>
      {roleChangeGroups(changes.roles).map(([key, group]) => {
        const [first] = group
        if (!first) return null
        const ways = group.filter((role) => role.type === 'way').map((role) => role.ref)
        const others = group.filter((role) => role.type !== 'way')
        return (
          <p key={key}>
            Role {roleName(first.from)} → {roleName(first.to)}:{' '}
            <WayLinks ids={ways} onSelect={onSelectWay} />
            {others.length > 0
              ? `${ways.length > 0 ? ', ' : ''}${others.map((role) => `${role.type}/${role.ref}`).join(', ')}`
              : null}
          </p>
        )
      })}
      {changes.added > 0 ? (
        <p>
          {changes.added} {plural(changes.added)} added
        </p>
      ) : null}
      {changes.removed > 0 ? (
        <p>
          {changes.removed} {plural(changes.removed)} removed
        </p>
      ) : null}
      {changes.reordered ? <p>Members reordered</p> : null}
    </div>
  )
}
