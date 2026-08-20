import type { MetadataOperator } from '../utils/metadataFilter.ts'

export type MetadataValueKind = 'text' | 'number'

export type ChangesetMetadataKey = {
  key: string
  label: string
  kind: MetadataValueKind
  operators: MetadataOperator[]
  placeholder?: string
  help: string
}

export const CHANGESET_METADATA_KEYS: ChangesetMetadataKey[] = [
  {
    key: 'hashtags',
    label: 'Hashtags',
    kind: 'text',
    operators: ['contains', 'exists', 'equals'],
    placeholder: '#hotosm-project',
    help: 'Semicolon-separated in OSM (e.g. #a;#b). Contains matches a substring, so #hotosm-project also matches #hotosm-project-16448.',
  },
  {
    key: 'changesets_count',
    label: 'Mapper changeset count',
    kind: 'number',
    operators: ['min', 'max', 'exists'],
    placeholder: '50',
    help: 'Set by iD (and similar web editors), not JOSM. 0 is a first edit.',
  },
  {
    key: 'locale',
    label: 'Editor language',
    kind: 'text',
    operators: ['contains', 'exists', 'equals'],
    placeholder: 'en',
    help: 'Contains: en also matches en-US.',
  },
  {
    key: 'host',
    label: 'Editor website',
    kind: 'text',
    operators: ['contains', 'exists', 'equals'],
    placeholder: 'openstreetmap.org',
    help: 'URL of the web editor, e.g. openstreetmap.org or tasks.hotosm.org.',
  },
  {
    key: 'bot',
    label: 'Bot',
    kind: 'text',
    operators: ['equals', 'exists'],
    placeholder: 'yes',
    help: 'Usually yes for automated edits.',
  },
  {
    key: 'bundle_id',
    label: 'App bundle id',
    kind: 'text',
    operators: ['contains', 'exists', 'equals'],
    placeholder: 'com.mapswithme.maps.pro',
    help: 'Mobile apps such as MAPS.ME.',
  },
]

export const METADATA_KEY_ALIASES: Record<string, { filter: string; message: string }> = {
  comment: { filter: 'Comment', message: 'Use the Comment filter instead.' },
  source: { filter: 'Source', message: 'Use the Source filter instead.' },
  imagery_used: { filter: 'Imagery used', message: 'Use the Imagery used filter instead.' },
  created_by: {
    filter: 'Editor',
    message: 'Use the Editor filter instead (created_by is stored as editor).',
  },
  review_requested: {
    filter: 'Reasons for Flagging',
    message:
      'OSMCha does not store review_requested in metadata. Use Reasons for Flagging → Review requested.',
  },
}

const keyByName = new Map(CHANGESET_METADATA_KEYS.map((entry) => [entry.key, entry]))

export function metadataKeyConfig(key: string): ChangesetMetadataKey | undefined {
  return keyByName.get(key.trim())
}

export function defaultOperatorForKey(key: string): MetadataOperator {
  const config = metadataKeyConfig(key)
  if (config) {
    if (config.key === 'bot') return 'equals'
    if (config.kind === 'number') return 'max'
    return 'contains'
  }
  return 'contains'
}

export const CUSTOM_METADATA_KEY = '__custom__'

export const DEFAULT_CUSTOM_OPERATORS: MetadataOperator[] = ['contains', 'exists', 'equals']
