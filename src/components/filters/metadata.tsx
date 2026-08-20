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

function operatorsForRow(row: MetadataRow): MetadataOperator[] {
  const config = metadataKeyConfig(row.key)
  if (config) return config.operators
  if (row.key.trim()) return DEFAULT_CUSTOM_OPERATORS
  return ['contains', 'exists', 'equals', 'min', 'max']
}

const CUSTOM_KEY_OPTION = KEY_OPTIONS[KEY_OPTIONS.length - 1]

function keyOptionForRow(row: MetadataRow): KeyOption {
  const config = metadataKeyConfig(row.key)
  if (config) {
    return KEY_OPTIONS.find((option) => option.key === config.key) ?? KEY_OPTIONS[0]
  }
  return CUSTOM_KEY_OPTION
}

function isCustomKeyRow(row: MetadataRow): boolean {
  return !metadataKeyConfig(row.key)
}

const OPERATOR_OPTIONS = (Object.keys(OPERATOR_LABELS) as MetadataOperator[]).map((operator) => ({
  id: operator,
  label: OPERATOR_LABELS[operator],
}))

function operatorOption(operator: MetadataOperator) {
  return OPERATOR_OPTIONS.find((option) => option.id === operator) ?? OPERATOR_OPTIONS[0]
}

type MetadataFilterProps = {
  name: string
  value?: Filter
  onChange: (name: string, value?: Filter | null) => void
}

function stateFromJoined(joined: string) {
  if (!joined) {
    return { rows: [] as MetadataRow[], rawMode: false, rawValue: '' }
  }
  if (!isSupportedMetadataQuery(joined)) {
    return { rows: [] as MetadataRow[], rawMode: true, rawValue: joined }
  }
  const { rows } = parseMetadataQuery(joined)
  return { rows, rawMode: false, rawValue: joined }
}

export function MetadataFilter({ name, value, onChange }: MetadataFilterProps) {
  const joinedValue = joinMetadataFilterValue(value)
  const initial = stateFromJoined(joinedValue)
  const [rows, setRows] = useState(initial.rows)
  const [rawMode, setRawMode] = useState(initial.rawMode)
  const [rawValue, setRawValue] = useState(initial.rawValue)
  const [prevJoined, setPrevJoined] = useState(joinedValue)
  const [lastWritten, setLastWritten] = useState(joinedValue)

  if (joinedValue !== prevJoined) {
    setPrevJoined(joinedValue)
    if (joinedValue !== lastWritten) {
      const next = stateFromJoined(joinedValue)
      setRows(next.rows)
      setRawMode(next.rawMode)
      setRawValue(next.rawValue)
    }
  }

  function commitRows(nextRows: MetadataRow[]) {
    setRows(nextRows)
    const filter = metadataRowsToFilter(nextRows)
    if (filter) {
      const serialized = joinMetadataFilterValue(filter)
      setLastWritten(serialized)
      onChange(name, filter)
      return
    }
    setLastWritten('')
    onChange(name)
  }

  function commitRaw(nextRaw: string) {
    setRawValue(nextRaw)
    const trimmed = nextRaw.trim()
    if (!trimmed) {
      setLastWritten('')
      onChange(name)
      return
    }

    if (isSupportedMetadataQuery(trimmed)) {
      const { rows: parsed } = parseMetadataQuery(trimmed)
      setRawMode(false)
      setRows(parsed)
      const filter = metadataRowsToFilter(parsed)
      if (filter) {
        const serialized = joinMetadataFilterValue(filter)
        setLastWritten(serialized)
        onChange(name, filter)
        return
      }
    }

    setRawMode(true)
    setLastWritten(trimmed)
    onChange(name, [{ label: trimmed, value: trimmed }])
  }

  function updateRow(id: string, patch: Partial<MetadataRow>) {
    commitRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: string) {
    commitRows(rows.filter((row) => row.id !== id))
  }

  function addRow() {
    commitRows([...rows, createEmptyMetadataRow()])
  }

  return (
    <div className="flex flex-col gap-3">
      <Text>
        Tags the editor attached to the changeset (not map-feature tags). You can see them on the
        OSM.org changeset page and under Changeset tags on a changeset. Combine several conditions;
        all must match.
      </Text>

      {!rawMode && rows.length === 0 ? (
        <Button
          type="button"
          outline
          className="min-h-11 w-fit cursor-pointer touch-manipulation select-none"
          onClick={addRow}
        >
          Add changeset tag
        </Button>
      ) : null}

      {!rawMode
        ? rows.map((row) => {
            const keyOption = keyOptionForRow(row)
            const customKey = isCustomKeyRow(row)
            const config = metadataKeyConfig(row.key)
            const alias = row.key.trim() ? METADATA_KEY_ALIASES[row.key.trim()] : undefined
            const error = validateMetadataRow(row)
            const availableOperators = operatorsForRow(row)
            const showValue = row.operator !== 'exists'

            return (
              <div key={row.id} className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto] sm:items-start">
                  <div className="flex flex-col gap-2">
                    <Listbox<KeyOption>
                      aria-label="Changeset tag key"
                      value={keyOption}
                      onChange={(option) => {
                        if (!option) return
                        if (option.key === CUSTOM_METADATA_KEY) {
                          updateRow(row.id, { key: '', operator: 'contains', value: '' })
                          return
                        }
                        updateRow(row.id, {
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
                          const nextKey = event.target.value
                          updateRow(row.id, {
                            key: nextKey,
                            operator: defaultOperatorForKey(nextKey),
                          })
                        }}
                      />
                    ) : null}
                  </div>

                  <Listbox<(typeof OPERATOR_OPTIONS)[number]>
                    aria-label="Match type"
                    value={operatorOption(row.operator)}
                    onChange={(option) => {
                      if (!option) return
                      const nextOperator = option.id
                      updateRow(row.id, {
                        operator: nextOperator,
                        value: nextOperator === 'exists' ? '' : row.value,
                      })
                    }}
                  >
                    {availableOperators.map((operator) => (
                      <ListboxOption key={operator} value={operatorOption(operator)}>
                        <ListboxLabel>{OPERATOR_LABELS[operator]}</ListboxLabel>
                      </ListboxOption>
                    ))}
                  </Listbox>

                  {showValue ? (
                    <Input
                      aria-label="Changeset tag value"
                      type={row.operator === 'min' || row.operator === 'max' ? 'number' : 'text'}
                      placeholder={config?.placeholder ?? 'Value'}
                      value={row.value}
                      invalid={Boolean(error && row.value.trim() === '')}
                      onChange={(event) => updateRow(row.id, { value: event.target.value })}
                    />
                  ) : (
                    <div className="hidden sm:block" aria-hidden="true" />
                  )}

                  <Button
                    plain
                    type="button"
                    aria-label="Remove changeset tag condition"
                    className="size-11 shrink-0 self-end p-0 sm:size-9"
                    onClick={() => removeRow(row.id)}
                  >
                    <XMarkIcon data-slot="icon" />
                  </Button>
                </div>

                {alias ? <Text>{alias.message}</Text> : null}
                {config?.help && !alias ? <Text>{config.help}</Text> : null}
                {error ? <Text className="text-red-600">{error}</Text> : null}
              </div>
            )
          })
        : null}

      {!rawMode && rows.length > 0 ? (
        <Button
          type="button"
          outline
          className="min-h-11 w-fit cursor-pointer touch-manipulation select-none"
          onClick={addRow}
        >
          Add changeset tag
        </Button>
      ) : null}

      <details className="rounded-lg">
        <summary className="flex min-h-11 cursor-pointer touch-manipulation list-none items-center rounded-lg px-1 text-sm/5 font-medium text-zinc-700 select-none marker:content-none active:bg-zinc-950/5 [&::-webkit-details-marker]:hidden">
          More about these tags
        </summary>
        <div className="px-1 pb-2">
          <Text>
            Editors such as iD attach key/value tags to each changeset (also listed on OSM.org).
            JOSM often omits tags like changesets_count or locale. “Contains” matches a substring;
            “Equals exactly” uses <code className="text-zinc-950">key__exact=value</code>; “Exists”
            matches any value with <code className="text-zinc-950">key=*</code>. Min/max apply to
            numeric tags. Conditions are combined with AND; negation and OR are not supported.
            Values cannot contain commas; hashtags in OSM use semicolons between tags.{' '}
            <TextLink href="https://wiki.openstreetmap.org/wiki/Changeset#Tags_on_changesets">
              OSM Wiki: tags on changesets
            </TextLink>
          </Text>
        </div>
      </details>

      <details className="rounded-lg" open={rawMode || undefined}>
        <summary className="flex min-h-11 cursor-pointer touch-manipulation list-none items-center rounded-lg px-1 text-sm/5 font-medium text-zinc-700 select-none marker:content-none active:bg-zinc-950/5 [&::-webkit-details-marker]:hidden">
          Raw query
        </summary>
        <div className="px-1 pb-2">
          <Text className="mb-2">
            Exact API string sent as the metadata filter. Unsupported lookups stay in raw form.
          </Text>
          <Input
            aria-label="Raw metadata filter query"
            value={rawMode ? rawValue : serializeMetadataRows(rows) || joinedValue}
            onChange={(event) => commitRaw(event.target.value)}
          />
          {rawMode ? (
            <Text className="mt-2 text-amber-700">
              This query uses unsupported match types. Edit it here or simplify to supported
              contains, exists, equals, min, or max lookups.
            </Text>
          ) : null}
        </div>
      </details>
    </div>
  )
}
