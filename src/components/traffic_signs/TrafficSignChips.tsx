import clsx from 'clsx'
import { useTrafficSigns } from '../../query/hooks/useTrafficSigns.ts'
import type { ResolvedSign } from './resolveTrafficSigns.ts'

function SignChip({ sign, muted }: { sign: ResolvedSign; muted: boolean }) {
  const title = [sign.name, sign.id !== sign.name ? sign.id : undefined, sign.description]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
      title={title}
      className={clsx(
        'inline-flex max-w-full min-w-0 items-center gap-1 rounded-md px-1 py-0.5 font-sans',
        sign.recognized
          ? 'bg-white ring-1 ring-zinc-950/10'
          : 'bg-zinc-100 ring-1 ring-zinc-950/5 ring-inset',
        muted && 'opacity-60',
      )}
    >
      {sign.svgUrl ? (
        <img
          src={sign.svgUrl}
          alt=""
          loading="lazy"
          className="h-6 w-auto max-w-12 flex-none object-contain"
        />
      ) : null}
      {sign.recognized ? (
        <span className="min-w-0 text-[11px] leading-tight text-zinc-800">
          {sign.name} <span className="font-mono text-zinc-400">{sign.id}</span>
        </span>
      ) : (
        <span className="min-w-0 font-mono text-[11px] leading-tight break-all text-zinc-500">
          {sign.id}
        </span>
      )}
    </li>
  )
}

/**
 * Icon and name of the signs in a `traffic_sign` value, below the tag row. Renders nothing while the
 * signs load, when the value has no country prefix and when the catalogue fails to load.
 */
export function TrafficSignChips({ value, removed }: { value: string; removed?: boolean }) {
  const { data } = useTrafficSigns(value)
  if (!data || data.length === 0) return null

  return (
    <ul
      aria-label="Traffic signs in this value"
      className="col-span-3 col-start-3 flex flex-wrap gap-1 pb-0.5 @min-[24rem]/tags:col-span-1 @min-[24rem]/tags:col-start-5"
    >
      {data.map((sign, index) => (
        <SignChip key={`${index}:${sign.id}`} sign={sign} muted={removed === true} />
      ))}
    </ul>
  )
}
