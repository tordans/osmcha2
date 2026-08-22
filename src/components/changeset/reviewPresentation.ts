/**
 * Review verdict presentation (Looks OK / Needs a look + tags).
 * Keep in sync with docs/review.md — change that page in the same PR.
 */

export type NamedTag = { id?: number; name: string }

export const RESOLVED_TAG_ID = 9
export const INTENTIONAL_TAG_ID = 1
export const UNINTENTIONAL_TAG_ID = 2
export const SEVERITY_LOW_TAG_ID = 6
export const SEVERITY_HIGH_TAG_ID = 7
export const SEVERITY_CRITICAL_TAG_ID = 8
export const UNRESOLVED_TAG_ID = 10
export const DWG_TAG_ID = 11

/** Tag ids that escalate Flag → MessageCircleWarning. */
export const ESCALATING_TAG_IDS = new Set([
  SEVERITY_HIGH_TAG_ID,
  SEVERITY_CRITICAL_TAG_ID,
  DWG_TAG_ID,
])

/** Mutually exclusive tag groups (at most one per group). */
export const TAG_EXCLUSIVE_GROUPS: number[][] = [
  [INTENTIONAL_TAG_ID, UNINTENTIONAL_TAG_ID],
  [SEVERITY_LOW_TAG_ID, SEVERITY_HIGH_TAG_ID, SEVERITY_CRITICAL_TAG_ID],
  [UNRESOLVED_TAG_ID, RESOLVED_TAG_ID],
]

export type ReviewIconKind = 'circleCheck' | 'flag' | 'messageWarning'
export type ReviewColor = 'green' | 'orange'

export type ReviewPresentation = {
  icon: ReviewIconKind
  color: ReviewColor
  name: string
  tooltip: string
}

export type ReviewTagMeta = {
  id: number
  name: string
  tooltip: string
  icon: ReviewIconKind
  group: 'intent' | 'severity' | 'followUp' | 'escalation'
}

/** Production changeset tags with UI copy. Stored `name` matches the API. */
export const REVIEW_TAG_META: ReviewTagMeta[] = [
  {
    id: UNINTENTIONAL_TAG_ID,
    name: 'Unintentional',
    tooltip: 'Looks like a mistake, not deliberate.',
    icon: 'flag',
    group: 'intent',
  },
  {
    id: INTENTIONAL_TAG_ID,
    name: 'Intentional',
    tooltip: 'Looks deliberate.',
    icon: 'flag',
    group: 'intent',
  },
  {
    id: SEVERITY_LOW_TAG_ID,
    name: 'Severity: Low',
    tooltip: 'Minor issues; still worth a look.',
    icon: 'flag',
    group: 'severity',
  },
  {
    id: SEVERITY_HIGH_TAG_ID,
    name: 'Severity: High',
    tooltip: 'Serious issues; discuss, revert, or fix.',
    icon: 'messageWarning',
    group: 'severity',
  },
  {
    id: SEVERITY_CRITICAL_TAG_ID,
    name: 'Severity: Critical',
    tooltip: 'Critical damage to the map; needs urgent attention.',
    icon: 'messageWarning',
    group: 'severity',
  },
  {
    id: UNRESOLVED_TAG_ID,
    name: 'Unresolved',
    tooltip: 'Still needs discussion, revert, or work.',
    icon: 'flag',
    group: 'followUp',
  },
  {
    id: RESOLVED_TAG_ID,
    name: 'Resolved',
    tooltip: 'The issues were addressed.',
    icon: 'circleCheck',
    group: 'followUp',
  },
  {
    id: DWG_TAG_ID,
    name: 'DWG',
    tooltip: 'Report this to the Data Working Group.',
    icon: 'messageWarning',
    group: 'escalation',
  },
]

export function hasResolvedTag(tags: NamedTag[] = []) {
  return tags.some((tag) => tag.id === RESOLVED_TAG_ID)
}

export function hasEscalatingTag(tags: NamedTag[] = []) {
  return tags.some((tag) => tag.id != null && ESCALATING_TAG_IDS.has(tag.id))
}

/** Sibling ids in the same exclusive group (excluding `tagId`). */
export function exclusiveSiblingsOf(tagId: number): number[] {
  for (const group of TAG_EXCLUSIVE_GROUPS) {
    if (group.includes(tagId)) {
      return group.filter((id) => id !== tagId)
    }
  }
  return []
}

export function reviewTagMeta(tagId: number): ReviewTagMeta | undefined {
  return REVIEW_TAG_META.find((tag) => tag.id === tagId)
}

type ReviewPresentationInput = {
  checked?: boolean
  harmful?: boolean | null
  tags?: NamedTag[]
  checkUser?: string | null
}

/**
 * Icon / color / name / tooltip from the binary verdict plus tags.
 * Precedence: Looks OK → Resolved → escalating tags → Flag.
 */
export function reviewPresentation({
  checked,
  harmful,
  tags = [],
  checkUser,
}: ReviewPresentationInput): ReviewPresentation | null {
  if (!checked) return null

  const reviewer = checkUser || 'Unknown user'
  const tagNames = tags.map((tag) => tag.name).filter(Boolean)

  if (harmful === false) {
    const leftover =
      tagNames.length > 0 ? ` Leftover tags: ${tagNames.join(', ')}.` : ''
    return {
      icon: 'circleCheck',
      color: 'green',
      name: 'Looks OK',
      tooltip: `Looks OK · by ${reviewer}.${leftover} Nothing stood out; I think this is OK.`,
    }
  }

  if (harmful === true) {
    if (hasResolvedTag(tags)) {
      return {
        icon: 'circleCheck',
        color: 'green',
        name: 'Resolved',
        tooltip: `Resolved · by ${reviewer}. The issues were addressed.`,
      }
    }

    const escalating = hasEscalatingTag(tags)
    const icon: ReviewIconKind = escalating ? 'messageWarning' : 'flag'
    const tagPart = tagNames.length > 0 ? ` · ${tagNames.join(' · ')}` : ''
    return {
      icon,
      color: 'orange',
      name: tagNames[0] ?? 'Needs a look',
      tooltip: `Needs a look${tagPart} · by ${reviewer}. Something here is worth checking or discussing.`,
    }
  }

  return null
}
