export function isChangesetPath(pathname: string): boolean {
  return /^\/changesets\/[^/]+$/.test(pathname)
}

export function isListHomePath(pathname: string): boolean {
  return pathname === '/'
}

export function isFullBleedPath(pathname: string): boolean {
  return isListHomePath(pathname) || isChangesetPath(pathname)
}
