/** Touch screens: focusing a field opens the keyboard, which a stray tap should not do. */
export function prefersTouchInput() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}
