import { relativeTime } from '@app/(map)/_components/Changeset/RelativeTime'

export const localDateTime = (date: Date | undefined | null) => {
  if (!date) return undefined
  return `${date.toLocaleDateString()}, ${date.toLocaleTimeString()}`
}

export const localDateTimeWithRelative = (date: Date | undefined | null) => {
  if (!date) return undefined
  return `${date.toLocaleDateString()}, ${date.toLocaleTimeString()} (${relativeTime(date)})`
}
