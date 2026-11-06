/** `1234567` → `1,234,567`, with en-US grouping independent of the browser locale. */
export default function numberWithCommas(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 20 })
}
