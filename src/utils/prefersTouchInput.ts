import { deviceInput } from './device.ts'

/** Touch screens: focusing a field opens the keyboard, which a stray tap should not do. */
export function prefersTouchInput() {
  return typeof window !== 'undefined' && deviceInput() === 'touch'
}
