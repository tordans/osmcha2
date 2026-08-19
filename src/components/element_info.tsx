import { ArrowRightIcon, ClockIcon, FlagIcon } from '@heroicons/react/16/solid'
import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import { diffArrays } from 'diff'
import { useState } from 'react'
import { RouterLink } from '../routing/RouterLink.tsx'
import { osmUrl } from '../config/constants.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { flagFeature, unflagFeature } from '../network/changeset.ts'
import { searchWithoutMap } from '../routing/mapParam.ts'
import { DropdownOpenElement } from './changeset/DropdownOpenElement.tsx'
import { elementCoord, elementOpenInUrls } from './changeset/elementOpenIn.ts'
import { TagValue } from './tag_value.tsx'
import { Badge } from './ui/badge.tsx'
import { Button } from './ui/button.tsx'
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from './ui/dropdown.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.tsx'
import { TextLink } from './ui/text.tsx'
import { typeScale } from './ui/typography.ts'

const rootRouteApi = getRouteApi('__root__')

const changesetLinkClassName =
  'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950'

interface ElementInfoProps {
  changeset: any
  changesetId: number
  action: any
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
}

function includesHttp(value: string) {
  return value.includes('http')
}

/*
 * Displays info about an element that was created/modified/deleted.
 * Shown when an element is selected on the changeset map.
 */
function ElementInfo({ changeset, changesetId, action, setHighlight }: ElementInfoProps) {
  const { token } = useAuth()
  const type = action.new.type as string
  const id = action.new.id as number
  const elementId = `${type}/${id}`

  if (!changeset) {
    return null
  }

  let actionPhrase: string
  let actionColor: 'green' | 'yellow' | 'red' | 'zinc'

  if (action.type === 'create') {
    actionPhrase = 'created'
    actionColor = 'green'
  } else if (action.type === 'modify') {
    // NOTE: adiffs sometimes contain 'modify' actions that are actually no-ops;
    // in this case the old and new versions are the same
    actionPhrase = action.old.version === action.new.version ? 'not changed' : 'modified'
    actionColor = action.old.version === action.new.version ? 'zinc' : 'yellow'
  } else if (action.type === 'delete') {
    actionPhrase = 'deleted'
    actionColor = 'red'
  } else {
    actionPhrase = 'unknown action'
    actionColor = 'zinc'
  }

  const lat = elementCoord(action, 'lat')
  const lon = elementCoord(action, 'lon')

  return (
    <div className="element-info">
      <h2 className={typeScale.heading}>
        <TextLink href={`https://www.openstreetmap.org/${elementId}`} target="_blank" rel="noopener noreferrer">
          {elementId}
        </TextLink>{' '}
        was <Badge color={actionColor}>{actionPhrase}</Badge>
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <HistoryDropdown id={elementId} />
        <DropdownOpenElement type={type} id={id} lat={lat} lon={lon} />
        <FlagButton
          key={elementId}
          changeset={changeset}
          changesetId={changesetId}
          featureId={elementId}
          token={token}
        />
      </div>
      <MetadataTable changesetId={changesetId} action={action} />
      <TagsTable action={action} />
      {action.new.type === 'relation' && (
        <RelationMembersTable action={action} setHighlight={setHighlight} />
      )}
    </div>
  )
}

export default ElementInfo

function HistoryDropdown({ id }: { id: string }) {
  const urls = elementOpenInUrls(id)

  return (
    <Dropdown>
      <DropdownButton
        outline
        aria-label={`History for ${id}`}
        className="min-h-11 cursor-pointer touch-manipulation select-none"
      >
        <ClockIcon data-slot="icon" className="size-4" />
        History
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem href={urls.history} target="_blank" rel="noopener noreferrer">
          OSM
        </DropdownItem>
        <DropdownItem href={urls.deepHistory} target="_blank" rel="noopener noreferrer">
          Deep History
        </DropdownItem>
        <DropdownItem href={urls.pewu} target="_blank" rel="noopener noreferrer">
          PeWu
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

function FlagButton({
  changeset,
  changesetId,
  featureId,
  token,
}: {
  changeset: any
  changesetId: number
  featureId: string
  token: string | null
}) {
  const reviewedFeatures = changeset?.properties?.reviewed_features || []
  const serverFlagged = reviewedFeatures.some(
    (entry: { id?: string }) => entry.id === featureId.replace('/', '-'),
  )
  const [optimisticFlagged, setOptimisticFlagged] = useState<boolean | null>(null)
  const flagged = optimisticFlagged ?? serverFlagged

  const handleClick = () => {
    if (!token) return
    const next = !flagged
    setOptimisticFlagged(next)
    if (flagged) {
      unflagFeature(changesetId, featureId)
    } else {
      flagFeature(changesetId, featureId)
    }
  }

  return (
    <Button
      outline
      onClick={handleClick}
      className="min-h-11 cursor-pointer touch-manipulation select-none"
    >
      <FlagIcon data-slot="icon" className={clsx('size-4', flagged && 'text-orange-600')} />
      {flagged ? 'Flagged (click to remove)' : 'Add to flagged'}
    </Button>
  )
}

function MetadataTable({ changesetId, action }: { changesetId: number; action: any }) {
  const search = rootRouteApi.useSearch()
  const showPrevious =
    action.type === 'delete' || (action.type === 'modify' && action.old.version !== action.new.version)

  const elements = showPrevious ? [action.old, action.new] : [action.new]

  return (
    <Table dense bleed className="mt-3 whitespace-normal">
      <TableHead>
        <TableRow>
          <TableHeader />
          {showPrevious && <TableHeader>Previous</TableHeader>}
          <TableHeader>Current</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">version</TableCell>
          {elements.map((element) => (
            <TableCell key={element.version}>{element.version}</TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">timestamp</TableCell>
          {elements.map((element) => (
            <TableCell key={element.version}>{element.timestamp}</TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">changeset</TableCell>
          {elements.map((element) => (
            <TableCell key={element.version}>
              {element.changeset !== changesetId ? (
                <RouterLink
                  to="/changesets/$id"
                  params={{ id: element.changeset }}
                  search={(prev) => searchWithoutMap({ ...prev, ...search })}
                  className={changesetLinkClassName}
                >
                  {element.changeset}
                </RouterLink>
              ) : (
                element.changeset
              )}
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">uid</TableCell>
          {elements.map((element) => (
            <TableCell key={element.version}>{element.uid}</TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">username</TableCell>
          {elements.map((element) => (
            <TableCell key={element.version}>
              <TextLink href={`${osmUrl}/user/${element.user}`} target="_blank" rel="noopener noreferrer">
                {element.user}
              </TextLink>
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  )
}

function TagsTable({ action }: { action: any }) {
  let allKeys: string[]

  if (action.type === 'create') {
    allKeys = Object.keys(action.new.tags)
  } else {
    allKeys = [...new Set([...Object.keys(action.old.tags), ...Object.keys(action.new.tags)])]
  }

  allKeys = allKeys.sort()

  if (allKeys.length === 0) {
    return <p className={clsx('mt-3 text-zinc-500', typeScale.body)}>No tags</p>
  }

  return (
    <Table dense bleed className="mt-3 font-mono whitespace-normal">
      <TableHead>
        <TableRow>
          <TableHeader>Tag</TableHeader>
          <TableHeader>Value</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {allKeys.map((key) => {
          const oldval = action.old ? action.old.tags[key] : undefined
          const newval = action.new ? action.new.tags[key] : undefined
          if (oldval === newval) {
            return (
              <TableRow key={key}>
                <TableCell className="align-top font-medium whitespace-normal" title={key}>
                  <span dir="auto">{key}</span>
                </TableCell>
                <TableCell
                  className={clsx(
                    'align-top whitespace-normal text-zinc-500',
                    includesHttp(newval) ? 'break-all' : 'break-words',
                  )}
                >
                  <span dir="auto">
                    <TagValue k={key} v={newval} />
                  </span>
                </TableCell>
              </TableRow>
            )
          }
          if (oldval === undefined) {
            return (
              <TableRow key={key}>
                <TableCell className="align-top font-medium whitespace-normal" title={key}>
                  <span dir="auto">{key}</span>
                </TableCell>
                <TableCell
                  className={clsx(
                    'align-top whitespace-normal bg-blue-100 text-blue-700',
                    includesHttp(newval) ? 'break-all' : 'break-words',
                  )}
                >
                  <span dir="auto">
                    <TagValue k={key} v={newval} />
                  </span>
                </TableCell>
              </TableRow>
            )
          }
          if (newval === undefined) {
            return (
              <TableRow key={key}>
                <TableCell className="align-top font-medium whitespace-normal" title={key}>
                  <span dir="auto">{key}</span>
                </TableCell>
                <TableCell
                  className={clsx(
                    'align-top whitespace-normal bg-orange-100 text-orange-500',
                    includesHttp(oldval) ? 'break-all' : 'break-words',
                  )}
                >
                  <span dir="auto">
                    <TagValue k={key} v={oldval} />
                  </span>
                </TableCell>
              </TableRow>
            )
          }
          return (
            <TableRow key={key}>
              <TableCell className="align-top font-medium whitespace-normal" title={key}>
                <span dir="auto">{key}</span>
              </TableCell>
              <TableCell
                className={clsx(
                  'align-top whitespace-normal bg-yellow-100',
                  includesHttp(oldval) || includesHttp(newval) ? 'break-all' : 'break-words',
                )}
              >
                <div className="flex items-center gap-1">
                  <span className="text-orange-500" dir="auto">
                    <TagValue k={key} v={oldval} />
                  </span>
                  <ArrowRightIcon className="size-3 flex-none" />
                  <span className="text-green-700" dir="auto">
                    <TagValue k={key} v={newval} />
                  </span>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function RelationMembersTable({
  action,
  setHighlight,
}: {
  action: any
  setHighlight: (type: string, id: number, isHighlighted: boolean) => void
}) {
  const oldMemberIds: string[] = action.old?.members.map((m: any) => `${m.type}/${m.ref}`) ?? []
  const newMemberIds: string[] = action.new?.members.map((m: any) => `${m.type}/${m.ref}`) ?? []

  const diff = diffArrays(oldMemberIds, newMemberIds, {
    oneChangePerToken: true,
  })

  return (
    <Table dense bleed className="mt-3 font-mono whitespace-normal">
      <TableHead>
        <TableRow>
          <TableHeader>Member</TableHeader>
          <TableHeader>Role</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {diff.map(({ value }) => {
          const id = value[0]
          const [type, ref] = id.split('/')
          const oldMember = action.old?.members.find((m: any) => m.type === type && m.ref === +ref)
          const newMember = action.new?.members.find((m: any) => m.type === type && m.ref === +ref)
          const oldrole = oldMember?.role
          const newrole = newMember?.role

          const onMouseEnter = () => setHighlight(type, +ref, true)
          const onMouseLeave = () => setHighlight(type, +ref, false)

          if (oldrole === newrole) {
            return (
              <TableRow key={id} className="cursor-pointer" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                <TableCell>{id}</TableCell>
                <TableCell>
                  <span dir="auto">{newrole}</span>
                </TableCell>
              </TableRow>
            )
          }
          if (oldrole === undefined) {
            return (
              <TableRow
                key={id}
                className="cursor-pointer bg-blue-100 text-blue-700"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                <TableCell>{id}</TableCell>
                <TableCell>
                  <span dir="auto">{newrole}</span>
                </TableCell>
              </TableRow>
            )
          }
          if (newrole === undefined) {
            return (
              <TableRow
                key={id}
                className="cursor-pointer bg-orange-100 text-orange-500"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                <TableCell>{id}</TableCell>
                <TableCell>
                  <span dir="auto">{oldrole}</span>
                </TableCell>
              </TableRow>
            )
          }
          return (
            <TableRow
              key={id}
              className="cursor-pointer bg-yellow-100"
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <TableCell>{id}</TableCell>
              <TableCell>
                <span className="text-orange-500" dir="auto">
                  {oldrole}
                </span>
                {' → '}
                <span className="text-green-700" dir="auto">
                  {newrole}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
