import { groupLayers, type EliLayer } from '@osm-editor-kit/maplibre-editor-layer-index'
import { toEliStyleId } from './basemapStyles.ts'

/**
 * The rows of the background list, as in Maid's imagery panel (`module-imagery`, ELI 0.2.0): the layers
 * of the view in six groups, a time series as one row with its dates as chips, best layers first.
 *
 * Pure: no React and no map.
 */

/** The groups of the background list, in the order they are shown. */
export const BACKGROUND_GROUPS = [
  { id: 'local-photo', label: 'Local aerial imagery' },
  { id: 'global-photo', label: 'Global aerial imagery' },
  { id: 'maps', label: 'Maps' },
  { id: 'historic', label: 'Historic' },
  { id: 'elevation', label: 'Elevation' },
  { id: 'other', label: 'Other' },
] as const

export type BackgroundGroupId = (typeof BACKGROUND_GROUPS)[number]['id']

/**
 * The group of a layer, by its category. An aerial photo is local when it has a coverage area and global
 * when it is worldwide. Categories that are not listed (`qa`, `other`, none) are in Other.
 */
export function backgroundGroup(
  category: string | undefined,
  worldwide: boolean,
): BackgroundGroupId {
  switch (category) {
    case 'photo':
      return worldwide ? 'global-photo' : 'local-photo'
    case 'map':
    case 'osmbasedmap':
      return 'maps'
    case 'historicmap':
    case 'historicphoto':
      return 'historic'
    case 'elevation':
      return 'elevation'
    case 'qa':
    case 'other':
    case undefined:
    default:
      return 'other'
  }
}

/** The rows in their groups, in the order of {@link BACKGROUND_GROUPS}. Empty groups are left out. */
export function groupRows<T extends { group: BackgroundGroupId }>(rows: readonly T[]) {
  return BACKGROUND_GROUPS.flatMap((group) => {
    const members = rows.filter((row) => row.group === group.id)
    return members.length > 0 ? [{ id: group.id, label: group.label, rows: members }] : []
  })
}

/** What the row needs of an ELI layer: the hydrated layer of the package. */
export type ImageryListLayer = Pick<
  EliLayer,
  'id' | 'name' | 'best' | 'category' | 'continents' | 'group'
>

/** One date of a series, a button under its row. */
export type ImageryChip = {
  /** Style id: the choice when this date is picked. */
  styleId: string
  /** The date as ELI gives it, for example `2025 Sommer`. */
  label: string
  /** The layer's own name: the name iD cites. */
  name: string
  best: boolean
  /** The changeset used exactly this layer. */
  used: boolean
}

/** One row: a standalone layer, or a series with its dates. */
export type ImageryRow = {
  key: string
  /** The series name without the date, or the layer's name. */
  name: string
  group: BackgroundGroupId
  /** ELI marks a layer of the row as best for the region. */
  best: boolean
  /** The changeset used exactly one of the layers of this row. */
  used: boolean
  /** The changeset used another date of this series than the ones listed. */
  usedOtherDate: boolean
  /** What a click on the row picks: the date the changeset used, else ELI's best, else the newest. */
  styleId: string
  /** Dates, newest first. Empty for a standalone layer. */
  chips: ImageryChip[]
}

/**
 * The rows of the layers in view, best rows first, then by name (as Maid's list). `usedStyleIds` are the
 * layers the changeset used (exact matches), `similarStyleIds` those of the same series (see
 * `resolveImageryUsed`).
 */
export function buildImageryRows(
  layers: readonly ImageryListLayer[],
  usedStyleIds: ReadonlySet<string> = new Set(),
  similarStyleIds: ReadonlySet<string> = new Set(),
): ImageryRow[] {
  const entries = groupLayers([...layers])
  return entries
    .map((entry): ImageryRow => {
      const usedVariant = entry.variants.find((variant) =>
        usedStyleIds.has(toEliStyleId(variant.id)),
      )
      // filed under the newest date, as Maid files it
      const filed = entry.variants[0] ?? entry.defaultVariant
      const chips: ImageryChip[] = entry.grouped
        ? entry.variants.map((variant) => ({
            styleId: toEliStyleId(variant.id),
            label: variant.group?.label ?? variant.name,
            name: variant.name,
            best: variant.best,
            used: usedStyleIds.has(toEliStyleId(variant.id)),
          }))
        : []
      return {
        key: entry.id,
        name: entry.name,
        group: backgroundGroup(filed.category, filed.continents.includes('world')),
        best: entry.defaultVariant.best,
        used: usedVariant !== undefined,
        usedOtherDate:
          usedVariant === undefined &&
          entry.variants.some((variant) => similarStyleIds.has(toEliStyleId(variant.id))),
        styleId: toEliStyleId((usedVariant ?? entry.defaultVariant).id),
        chips,
      }
    })
    .sort(
      (a, b) =>
        Number(b.best) - Number(a.best) ||
        a.name.localeCompare(b.name, 'en') ||
        a.key.localeCompare(b.key),
    )
}

/** Whether a row is the background drawn now (any of its dates). */
export function rowIsShown(row: ImageryRow, styleId: string): boolean {
  return row.styleId === styleId || row.chips.some((chip) => chip.styleId === styleId)
}
