import {
  NOTE_LINK_HOSTS,
  NOTE_LINK_PATH_PREFIXES,
  NOTE_PUBLIC_ORIGIN,
} from '../config/constants.ts'
import { parsePinParam, serializePinParam, type PinParam } from '../routing/pinParam.ts'
import { parseRefParam, serializeRefParam, type RefParam } from '../routing/refParam.ts'

export type NoteTarget = {
  /** Absent means the note is changeset-level (pin-only). */
  ref?: RefParam
  pin?: PinParam
}

export type ParsedNote = NoteTarget & {
  body: string
}

export type ParsedDiscussionPost = {
  /** Text before the first valid See header. Empty string if none. */
  intro: string
  notes: ParsedNote[]
}

export type ComposeNote = NoteTarget & {
  body: string
}

const SEE_URL_IN_LINE = /https?:\/\/\S+/i

type OpenBlock =
  | { kind: 'intro'; lines: string[] }
  | { kind: 'note'; target: NoteTarget; lines: string[] }
  | { kind: 'discard' }

type SeeLine =
  | { kind: 'text' }
  | { kind: 'footer' }
  | { kind: 'skip' }
  | { kind: 'note'; target: NoteTarget }

function stripTrailingSlash(origin: string): string {
  return origin.endsWith('/') ? origin.slice(0, -1) : origin
}

function hostAllowed(hostname: string, linkHosts: readonly string[]): boolean {
  const needle = hostname.toLowerCase()
  return linkHosts.some((host) => host.toLowerCase() === needle)
}

function changesetPathPrefixes(): string[] {
  const prefixes = new Set<string>(NOTE_LINK_PATH_PREFIXES)
  const base = String(import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '')
  if (base && base !== '/') prefixes.add(base)
  return [...prefixes]
}

function isThisChangesetPath(pathname: string, changesetId: number): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return changesetPathPrefixes().some(
    (prefix) => normalized === `${prefix}/changesets/${changesetId}`,
  )
}

/** Leave `/`, `:`, and `,` readable in posted See URLs, matching routerSearch. */
function encodeNoteQueryValue(value: string): string {
  return encodeURIComponent(value)
    .replaceAll('%2F', '/')
    .replaceAll('%3A', ':')
    .replaceAll('%2C', ',')
}

function classifySeeLine(line: string, changesetId: number, linkHosts: readonly string[]): SeeLine {
  if (!line.startsWith('See ')) return { kind: 'text' }
  const match = SEE_URL_IN_LINE.exec(line)
  if (!match) return { kind: 'text' }

  let url: URL
  try {
    url = new URL(match[0])
  } catch {
    return { kind: 'text' }
  }

  if (!hostAllowed(url.hostname, linkHosts)) return { kind: 'text' }
  if (!isThisChangesetPath(url.pathname, changesetId)) return { kind: 'text' }

  const hasRef = url.searchParams.has('ref')
  const hasPin = url.searchParams.has('pin')
  if (!hasRef && !hasPin) return { kind: 'footer' }

  if (hasRef) {
    const ref = parseRefParam(url.searchParams.get('ref') ?? '')
    if (!ref) return { kind: 'skip' }
    const pin = hasPin ? (parsePinParam(url.searchParams.get('pin') ?? '') ?? undefined) : undefined
    return { kind: 'note', target: pin ? { ref, pin } : { ref } }
  }

  const pin = parsePinParam(url.searchParams.get('pin') ?? '')
  if (!pin) return { kind: 'skip' }
  return { kind: 'note', target: { pin } }
}

function emptyPost(): ParsedDiscussionPost {
  return { intro: '', notes: [] }
}

/**
 * Split a discussion post into an intro and note groups.
 * Never throws: garbage, empty input, or no URLs yield `{ intro, notes: [] }`.
 */
export function parseDiscussionNotes(
  text: string,
  options: { changesetId: number; linkHosts?: readonly string[] },
): ParsedDiscussionPost {
  if (!text) return emptyPost()

  try {
    const linkHosts = options.linkHosts ?? NOTE_LINK_HOSTS
    const notes: ParsedNote[] = []
    let intro = ''
    let current: OpenBlock = { kind: 'intro', lines: [] }

    const flush = () => {
      if (current.kind === 'intro') {
        intro = current.lines.join('\n').trim()
      } else if (current.kind === 'note') {
        notes.push({ ...current.target, body: current.lines.join('\n').trimEnd() })
      }
    }

    for (const line of text.split(/\r?\n/)) {
      const classified = classifySeeLine(line, options.changesetId, linkHosts)
      if (classified.kind === 'text') {
        if (current.kind !== 'discard') current.lines.push(line)
        continue
      }
      flush()
      current =
        classified.kind === 'note'
          ? { kind: 'note', target: classified.target, lines: [] }
          : { kind: 'discard' }
    }
    flush()
    return { intro, notes }
  } catch {
    return { intro: text.trim(), notes: [] }
  }
}

export function seeLabel(target: NoteTarget): string {
  const objectLabel = target.ref
    ? target.ref.key
      ? `\`${target.ref.type}/${target.ref.id}\` > \`${target.ref.key}\``
      : `\`${serializeRefParam(target.ref)}\``
    : ''
  if (target.pin && objectLabel) return `📍 ${objectLabel}`
  if (target.pin) return '📍'
  return objectLabel
}

export function noteSeeUrl(options: {
  origin: string
  changesetId: number
  target: NoteTarget
}): string {
  const origin = stripTrailingSlash(options.origin)
  const path = `${origin}/changesets/${options.changesetId}`
  const query: string[] = []
  if (options.target.ref) {
    query.push(`ref=${encodeNoteQueryValue(serializeRefParam(options.target.ref))}`)
  }
  if (options.target.pin) {
    query.push(`pin=${encodeNoteQueryValue(serializePinParam(options.target.pin))}`)
  }
  return query.length ? `${path}?${query.join('&')}` : path
}

function hasNoteTarget(note: NoteTarget): boolean {
  return note.ref !== undefined || note.pin !== undefined
}

/**
 * Compose intro + See groups into one OSM discussion body.
 * Empty intro and no groups returns `''` (callers decide whether to post).
 * Intro-only posts get a reference footer; grouped posts do not.
 */
export function composeDiscussionPost(input: {
  changesetId: number
  intro?: string
  notes?: ComposeNote[]
  origin?: string
}): string {
  const origin = stripTrailingSlash(input.origin ?? NOTE_PUBLIC_ORIGIN)
  const intro = input.intro?.trim() ?? ''
  const notes = (input.notes ?? []).filter(hasNoteTarget)
  const sections: string[] = []

  if (intro) sections.push(intro)

  for (const note of notes) {
    const target: NoteTarget = {
      ...(note.ref ? { ref: note.ref } : {}),
      ...(note.pin ? { pin: note.pin } : {}),
    }
    const header = `See ${seeLabel(target)} ${noteSeeUrl({ origin, changesetId: input.changesetId, target })}`
    const body = note.body.trimEnd()
    sections.push(body ? `${header}\n${body}` : header)
  }

  if (notes.length === 0 && intro) {
    sections.push(`See ${origin}/changesets/${input.changesetId}`)
  }

  return sections.join('\n\n')
}
