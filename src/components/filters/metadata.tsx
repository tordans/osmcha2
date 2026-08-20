import { XMarkIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import {
  CHANGESET_METADATA_KEYS,
  CUSTOM_METADATA_KEY,
  DEFAULT_CUSTOM_OPERATORS,
  METADATA_KEY_ALIASES,
  defaultOperatorForKey,
  metadataKeyConfig,
} from '../../config/changesetMetadataKeys.ts'
import {
  canonicalMetadataQuery,
  createEmptyMetadataRow,
  isSupportedMetadataQuery,
  joinMetadataFilterValue,
  metadataRowsToFilter,
  parseMetadataQuery,
  serializeMetadataRows,
  validateMetadataRow,
  type MetadataOperator,
  type MetadataRow,
} from '../../utils/metadataFilter.ts'
import { Button } from '../ui/button.tsx'
import { Input } from '../ui/input.tsx'
import { Listbox, ListboxLabel, ListboxOption } from '../ui/listbox.tsx'
import { Text, TextLink } from '../ui/text.tsx'
import type { Filter } from './index.ts'

const OPERATOR_LABELS: Record<MetadataOperator, string> = {
  contains: 'Contains',
  exists: 'Exists (any value)',
  equals: 'Equals exactly',
  min: 'At least (≥)',
  max: 'At most (≤)',
}

type KeyOption = {
  id: string
  label: string
  key: string
}

const KEY_OPTIONS: KeyOption[] = [
  ...CHANGESET_METADATA_KEYS.map((entry) => ({
    id: entry.key,
    label: entry.label,
    key: entry.key,
  })),
  { id: CUSTOM_METADATA_KEY, label: 'Custom key…', key: CUSTOM_METADATA_KEY },
]

const CUSTOM_KEY_OPTION = KEY_OPTIONS[KEY_OPTIONS.length - 1]!

const OPERATOR_OPTIONS = (Object.keys(OPERATOR_LABELS) as MetadataOperator[]).map((operator) => ({
  id: operator,
  label: OPERATOR_LABELS[operator],
}))

function operatorsForRow(row: MetadataRow): MetadataOperator[] {
  return metadataKeyConfig(row.key)?.operators ?? DEFAULT_CUSTOM_OPERATORS
}

function keyOptionForRow(row: MetadataRow): KeyOption {
  const config = metadataKeyConfig(row.key)
  if (!config) return CUSTOM_KEY_OPTION
  return KEY_OPTIONS.find((option) => option.key === config.key) ?? KEY_OPTIONS[0]!
}

function operatorOption(operator: MetadataOperator) {
  return OPERATOR_OPTIONS.find((option) => option.id === operator) ?? OPERATOR_OPTIONS[0]!
}

type EditorState = {
  rows: MetadataRow[]
  rawMode: boolean
  rawValue: string
}

function editorFromQuery(joined: string): EditorState {
  if (!joined) return { rows: [], rawMode: false, rawValue: '' }
  const parsed = parseMetadataQuery(joined)
  if (parsed.unsupported) return { rows: [], rawMode: true, rawValue: joined }
  return { rows: parsed.rows, rawMode: false, rawValue: joined }
}

type MetadataFilterProps = {
  name: string
  value?: Filter
  onChange: (name: string, value?: Filter | null) => void
}

export function MetadataFilter({ name, value, onChange }: MetadataFilterProps) {
  const joined = joinMetadataFilterValue(value)
  const [editor, setEditor] = useState(() => editorFromQuery(joined))

  const localJoined = editor.rawMode ? editor.rawValue.trim() : serializeMetadataRows(editor.rows)
  if (canonicalMetadataQuery(joined) !== localJoined) {
    setEditor(editorFromQuery(joined))
  }

  function commitRows(rows: MetadataRow[]) {
    setEditor({ rows, rawMode: false, rawValue: serializeMetadataRows(rows) })
    onChange(name, metadataRowsToFilter(rows))
  }

  function commitRaw(nextRaw: string) {
    const trimmed = nextRaw.trim()
    if (!trimmed) {
      setEditor({ rows: [], rawMode: false, rawValue: '' })
      onChange(name)
      return
    }
    if (isSupportedMetadataQuery(trimmed)) {
      const { rows } = parseMetadataQuery(trimmed)
      setEditor({ rows, rawMode: false, rawValue: serializeMetadataRows(rows) })
      onChange(name, metadataRowsToFilter(rows))
      return
    }
    setEditor({ rows: [], rawMode: true, rawValue: nextRaw })
    onChange(name, [{ label: trimmed, value: trimmed }])
  }

  const { rows, rawMode, rawValue } = editor
  const rawInputValue = rawMode ? rawValue : serializeMetadataRows(rows) || joined

  return (
    <div className="flex flex-col gap-3">
      <Text>
        Tags the editor attached to the changeset (not OSM feature tags). Combine conditions; all
        must match.{' '}
        <TextLink href="https://wiki.openstreetmap.org/wiki/Changeset#Tags_on_changesets">
          OSM Wiki
        </TextLink>
      </Text>

      {rawMode ? null : (
        <>
          {rows.map((row) => (
            <MetadataRowFields
              key={row.id}
              row={row}
              onPatch={(patch) =>
                commitRows(rows.map((item) => (item.id === row.id ? { ...item, ...patch } : item)))
              }
              onRemove={() => commitRows(rows.filter((item) => item.id !== row.id))}
            />
          ))}
          <Button
            type="button"
            outline
            className="min-h-11 w-fit cursor-pointer touch-manipulation select-none"
            onClick={() => commitRows([...rows, createEmptyMetadataRow()])}
          >
            Add changeset tag
          </Button>
        </>
      )}

      <details className="rounded-lg" open={rawMode || undefined}>
        <summary className="flex min-h-11 cursor-pointer touch-manipulation list-none items-center rounded-lg px-1 text-sm/5 font-medium text-zinc-700 select-none marker:content-none active:bg-zinc-950/5 [&::-webkit-details-marker]:hidden">
          Raw query
        </summary>
        <div className="px-1 pb-2">
          <Text className="mb-2">API metadata string. Unsupported lookups stay here.</Text>
          <Input
            aria-label="Raw metadata filter query"
            value={rawInputValue}
            onChange={(event) => commitRaw(event.target.value)}
          />
          {rawMode ? (
            <Text className="mt-2 text-amber-700">
              This query uses unsupported match types. Simplify to contains, exists, equals, min, or
              max.
            </Text>
          ) : null}
        </div>
      </details>
    </div>
  )
}

function MetadataRowFields({
  row,
  onPatch,
  onRemove,
}: {
  row: MetadataRow
  onPatch: (patch: Partial<MetadataRow>) => void
  onRemove: () => void
}) {
  const customKey = !metadataKeyConfig(row.key)
  const config = metadataKeyConfig(row.key)
  const alias = row.key.trim() ? METADATA_KEY_ALIASES[row.key.trim()] : undefined
  const error = validateMetadataRow(row)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto] sm:items-start">
        <div className="flex flex-col gap-2">
          <Listbox<KeyOption>
            aria-label="Changeset tag key"
            value={keyOptionForRow(row)}
            onChange={(option) => {
              if (!option) return
              if (option.key === CUSTOM_METADATA_KEY) {
                onPatch({ key: '', operator: 'contains', value: '' })
                return
              }
              onPatch({
                key: option.key,
                operator: defaultOperatorForKey(option.key),
                value: '',
              })
            }}
          >
            {KEY_OPTIONS.map((option) => (
              <ListboxOption key={option.id} value={option}>
                <ListboxLabel>{option.label}</ListboxLabel>
              </ListboxOption>
            ))}
          </Listbox>
          {customKey ? (
            <Input
              aria-label="Custom changeset tag key"
              placeholder="Custom key"
              value={row.key}
              invalid={Boolean(error && !row.key.trim())}
              onChange={(event) => {
                const key = event.target.value
                onPatch({ key, operator: defaultOperatorForKey(key) })
              }}
            />
          ) : null}
        </div>

        <Listbox<(typeof OPERATOR_OPTIONS)[number]>
          aria-label="Match type"
          value={operatorOption(row.operator)}
          onChange={(option) => {
            if (!option) return
            onPatch({
              operator: option.id,
              value: option.id === 'exists' ? '' : row.value,
            })
          }}
        >
          {operatorsForRow(row).map((operator) => (
            <ListboxOption key={operator} value={operatorOption(operator)}>
              <ListboxLabel>{OPERATOR_LABELS[operator]}</ListboxLabel>
            </ListboxOption>
          ))}
        </Listbox>

        {row.operator === 'exists' ? (
          <div className="hidden sm:block" aria-hidden="true" />
        ) : (
          <Input
            aria-label="Changeset tag value"
            type={row.operator === 'min' || row.operator === 'max' ? 'number' : 'text'}
            placeholder={config?.placeholder ?? 'Value'}
            value={row.value}
            invalid={Boolean(error && row.value.trim() === '')}
            onChange={(event) => onPatch({ value: event.target.value })}
          />
        )}

        <Button
          plain
          type="button"
          aria-label="Remove changeset tag condition"
          className="size-11 shrink-0 self-end p-0 sm:size-9"
          onClick={onRemove}
        >
          <XMarkIcon data-slot="icon" />
        </Button>
      </div>

      {alias ? <Text>{alias}</Text> : null}
      {config?.help && !alias ? <Text>{config.help}</Text> : null}
      {error ? <Text className="text-red-600">{error}</Text> : null}
    </div>
  )
}
