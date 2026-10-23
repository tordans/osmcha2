/**
 * Holds at most one camera move while the map is hidden. A newer move replaces the
 * older one, so revealing the map flies straight to the latest target.
 */
export function createPendingCamera<Action>() {
  let pending: Action | null = null

  return {
    defer(action: Action) {
      pending = action
    },
    /** The latest deferred move, removed from the queue. */
    take() {
      const action = pending
      pending = null
      return action
    },
    clear() {
      pending = null
    },
  }
}
