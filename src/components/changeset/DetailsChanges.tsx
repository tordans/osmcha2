import * as Headless from '@headlessui/react'
import { ChevronRightIcon, EyeIcon } from '@heroicons/react/16/solid'
import {
  ExclamationTriangleIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { Fragment } from 'react'
import { Loading } from '../loading.tsx'
import { TagRows } from '../tag_rows.tsx'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Tooltip } from '../ui/tooltip.tsx'
import { typeScale } from '../ui/typography.ts'
import {
  buildElementChanges,
  groupChangesByTagMutation,
  groupElementChanges,
  mergeFlaggedFeatures,
  tagMutationRows,
  type AdiffAction,
  type ElementChange,
  type FlaggedFeature,
  type NamedReason,
} from './changesetElements.ts'
import { DropdownOpenElement } from './DropdownOpenElement.tsx'
import { FlagFeatureButton } from './FlagFeatureButton.tsx'

const ACTION_LABEL = {
  create: 'Created',
  modify: 'Modified',
  delete: 'Deleted',
} as const

const ACTION_ICON = {
  create: PlusCircleIcon,
  modify: PencilIcon,
  delete: TrashIcon,
} as const

const disclosureTransition = { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }

type ReviewedFeature = { id?: string; user?: string }

type DetailsChangesProps = {
  changesetId: number
  adiff?: { actions?: AdiffAction[] } | null
  features?: FlaggedFeature[]
  reviewedFeatures?: ReviewedFeature[]
  reasons?: NamedReason[]
  selected?: AdiffAction | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
}

function isUserFlagged(reviewedFeatures: ReviewedFeature[], type: string, id: number) {
  const featureParam = `${type}-${id}`
  return reviewedFeatures.some((entry) => entry.id === featureParam)
}

export function DetailsChanges({
  changesetId,
  adiff,
  features = [],
  reviewedFeatures = [],
  reasons = [],
  selected,
  setHighlight,
  zoomToAndSelect,
}: DetailsChangesProps) {
  const flagged = mergeFlaggedFeatures(features, reviewedFeatures)
  const grouped = groupElementChanges(buildElementChanges(adiff?.actions ?? [], flagged, reasons))

  if (!adiff) {
    return <Loading className="pt-10" />
  }

  if (grouped.length === 0) {
    return (
      <p className={clsx('px-3 py-6 text-center text-zinc-500', typeScale.body)}>
        No element changes in this changeset.
      </p>
    )
  }

  return (
    <section className="my-2">
      {grouped.map(([actionType, changes]) => {
        const Icon = ACTION_ICON[actionType]
        return (
          <Fragment key={actionType}>
            <h2
              className={clsx(
                typeScale.heading,
                'mx-2 mt-3 flex items-center gap-1 rounded-sm border border-zinc-950/10 bg-zinc-50 px-2 py-1',
              )}
            >
              <Icon className="size-4 flex-none" /> {ACTION_LABEL[actionType]}
            </h2>
            <ul>
              {groupChangesByTagMutation(changes).map((group) =>
                group.length === 1 ? (
                  <ElementChangeRow
                    key={`${group[0].type}/${group[0].id}`}
                    change={group[0]}
                    changesetId={changesetId}
                    reviewedFeatures={reviewedFeatures}
                    selected={selected}
                    setHighlight={setHighlight}
                    zoomToAndSelect={zoomToAndSelect}
                  />
                ) : (
                  <TagMutationGroup
                    key={group.map((change) => `${change.type}/${change.id}`).join(',')}
                    changes={group}
                    changesetId={changesetId}
                    reviewedFeatures={reviewedFeatures}
                    selected={selected}
                    setHighlight={setHighlight}
                    zoomToAndSelect={zoomToAndSelect}
                  />
                ),
              )}
            </ul>
          </Fragment>
        )
      })}
    </section>
  )
}

function isSelected(change: ElementChange, selected?: AdiffAction | null) {
  const element = selected?.new ?? selected?.old
  return element?.type === change.type && element?.id === change.id
}

function TagMutationGroup({
  changes,
  changesetId,
  reviewedFeatures,
  selected,
  setHighlight,
  zoomToAndSelect,
}: {
  changes: ElementChange[]
  changesetId: number
  reviewedFeatures: ReviewedFeature[]
  selected?: AdiffAction | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
}) {
  const mutations = tagMutationRows(changes[0].tags)
  const containsSelected = changes.some((change) => isSelected(change, selected))

  return (
    <li className="px-2 py-2">
      <Headless.Disclosure defaultOpen={containsSelected}>
        {({ open }) => (
          <>
            <Headless.DisclosureButton
              aria-label={`${changes.length} elements with the same tag changes`}
              className="flex min-h-11 w-full cursor-pointer touch-manipulation items-center gap-2 rounded px-1 text-left text-sm font-medium select-none hover:bg-zinc-50 active:bg-zinc-950/5"
            >
              <motion.span
                className="inline-flex origin-center"
                initial={false}
                animate={{ rotate: open ? 90 : 0 }}
                transition={disclosureTransition}
              >
                <ChevronRightIcon className="size-4 flex-none" />
              </motion.span>
              <span>Same tag changes</span>
              <Badge>{changes.length}</Badge>
            </Headless.DisclosureButton>
            <div className="mt-1 border-t font-mono">
              <TagRows rows={mutations} emptyLabel="No tag changes" />
            </div>
            <Headless.DisclosurePanel static>
              <motion.div
                initial={false}
                animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                transition={disclosureTransition}
                className="overflow-hidden"
                inert={!open}
              >
                <ul>
                  {changes.map((change) => (
                    <ElementChangeRow
                      key={`${change.type}/${change.id}`}
                      change={change}
                      changesetId={changesetId}
                      reviewedFeatures={reviewedFeatures}
                      selected={selected}
                      setHighlight={setHighlight}
                      zoomToAndSelect={zoomToAndSelect}
                      showTags={false}
                    />
                  ))}
                </ul>
              </motion.div>
            </Headless.DisclosurePanel>
          </>
        )}
      </Headless.Disclosure>
    </li>
  )
}

function ElementChangeRow({
  change,
  changesetId,
  reviewedFeatures,
  selected,
  setHighlight,
  zoomToAndSelect,
  showTags = true,
}: {
  change: ElementChange
  changesetId: number
  reviewedFeatures: ReviewedFeature[]
  selected?: AdiffAction | null
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
  zoomToAndSelect: (type: string, id: number) => void
  showTags?: boolean
}) {
  const Icon = ACTION_ICON[change.actionType]
  const currentSelect = isSelected(change, selected)
  const flaggedLabel = [
    change.flagged?.name,
    ...((change.flagged?.reasons ?? []) as string[]),
    change.flagged?.userFlag,
    change.flagged?.note,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
      className={clsx(
        'relative flex w-full flex-col items-start justify-between gap-1 rounded px-2 py-2',
        currentSelect ? 'bg-yellow-50' : 'hover:bg-zinc-50 active:bg-zinc-950/5',
      )}
      onMouseEnter={() => setHighlight(change.type, change.id, true)}
      onMouseLeave={() => setHighlight(change.type, change.id, false)}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <h3 className={clsx(typeScale.body, 'flex min-w-0 items-center gap-1 font-normal')}>
          <Icon className="size-4 flex-none" />
          <span className="truncate">
            {change.type}/{change.id}
          </span>
          {change.version != null ? <span className="text-zinc-400">#{change.version}</span> : null}
        </h3>
        <div className="flex shrink-0 items-center justify-end gap-1">
          {change.flagged ? (
            <Tooltip
              content={flaggedLabel || 'Flagged feature'}
              aria-label={`Show flagged ${change.type}/${change.id} on map`}
              onClick={() => zoomToAndSelect(change.type, change.id)}
              className="min-h-11 min-w-11 justify-center"
            >
              <Badge color="orange">
                <ExclamationTriangleIcon className="size-3.5" />
                {change.flagged.reasons[0] ?? change.flagged.name ?? 'Flagged'}
              </Badge>
            </Tooltip>
          ) : null}
          {change.geometry === 'moved' ? <Badge color="yellow">Moved</Badge> : null}
          {change.geometry === 'rewritten' ? <Badge color="yellow">Rewritten</Badge> : null}
          {change.nodeStats ? (
            <Tooltip
              content={
                Object.values(change.nodeStats).every((value) => value === 0)
                  ? 'Only tagging was changed; no changes to the geometry were made.'
                  : `Changes to this way: ${change.nodeStats.added} nodes added, ${change.nodeStats.modified} nodes modified and ${change.nodeStats.deleted} nodes deleted.`
              }
              className="min-h-11"
            >
              <Badge color="blue" rounded="left">
                {change.nodeStats.added}
              </Badge>
              <Badge color="yellow" className="-my-1" rounded="none">
                {change.nodeStats.modified}
              </Badge>
              <Badge color="red" rounded="right">
                {change.nodeStats.deleted}
              </Badge>
            </Tooltip>
          ) : null}
          <FlagFeatureButton
            changesetId={changesetId}
            featureId={`${change.type}/${change.id}`}
            initiallyFlagged={isUserFlagged(reviewedFeatures, change.type, change.id)}
          />
          <Button
            outline
            aria-label={`Show ${change.type}/${change.id} on map`}
            onClick={() => zoomToAndSelect(change.type, change.id)}
            className="min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none"
          >
            <EyeIcon data-slot="icon" />
          </Button>
          <DropdownOpenElement
            type={change.type}
            id={change.id}
            lat={change.lat}
            lon={change.lon}
          />
        </div>
      </div>
      {showTags ? (
        <div className="w-full border-t font-mono">
          <TagRows rows={change.tags} emptyLabel="No tags" />
        </div>
      ) : null}
    </li>
  )
}
