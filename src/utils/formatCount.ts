/** Locale-formatted count with a short suffix once the value reaches 1,000. */
export function formatCompactCount(count: number, locale?: string): string {
  if (!Number.isFinite(count)) return '0'
  const abs = Math.abs(count)
  if (abs < 1000) return count.toLocaleString(locale)

  const [scaled, suffix] = abs >= 1_000_000 ? [count / 1_000_000, 'M'] : [count / 1000, 'k']
  return `${scaled.toLocaleString(locale, { maximumFractionDigits: 1 })} ${suffix}`
}
