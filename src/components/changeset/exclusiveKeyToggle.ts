export function exclusiveKeyToggleState(
  options: ReadonlyArray<{ label: string }>,
  prev: Record<string, boolean>,
  label: string,
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const opt of options) {
    next[opt.label] = opt.label === label ? !prev[label] : false
  }
  return next
}
