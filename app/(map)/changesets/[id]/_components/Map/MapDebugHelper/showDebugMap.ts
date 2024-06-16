export const showDebugMap = (lookFor: string) => {
  if (typeof window === 'undefined') return false
  if (window.location.hostname.includes('.test')) return true
  return window.location.hash.includes(lookFor)
}
