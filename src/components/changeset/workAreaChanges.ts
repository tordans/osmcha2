import type { WorkArea } from '../../views/changesetWorkAreas.ts'
import type { ElementChange } from './changesetElements.ts'

export type WorkAreaChanges = { area: WorkArea | null; changes: ElementChange[] }

/**
 * Listed changes per work area, in area order. Changes outside every area
 * (no geometry, or a relation that touches none) come last under `area: null`.
 */
export function groupChangesByWorkArea(changes: ElementChange[], areas: readonly WorkArea[]) {
  const groups: WorkAreaChanges[] = areas.map((area) => ({ area, changes: [] }))
  const elsewhere: WorkAreaChanges = { area: null, changes: [] }
  for (const change of changes) {
    const key = `${change.type}/${change.id}`
    const group = groups.find((item) => item.area?.elementKeys.has(key)) ?? elsewhere
    group.changes.push(change)
  }
  return elsewhere.changes.length > 0 ? [...groups, elsewhere] : groups
}
