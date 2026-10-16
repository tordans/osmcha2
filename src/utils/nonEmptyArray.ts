/** An array with at least one element, so `[0]` and destructuring yield a defined value. */
export type NonEmptyArray<T> = [T, ...T[]]
