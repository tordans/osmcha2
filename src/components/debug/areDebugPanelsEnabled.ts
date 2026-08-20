/** Pink JSON inspectors: on in the Vite dev server, off in production builds. */
export function areDebugPanelsEnabled(dev = import.meta.env.DEV): boolean {
  return Boolean(dev)
}
