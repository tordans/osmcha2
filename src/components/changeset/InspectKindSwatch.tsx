import clsx from 'clsx'
import { SPYGLASS_SWATCH_CLASS } from '../../views/spyglassOverlay.ts'
import { ACTION } from './actionColors.ts'

export function InspectKindSwatch({
  kind,
  className,
}: {
  kind: 'noop' | 'spyglass'
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-block shrink-0 rounded-full',
        kind === 'noop' ? ACTION.noop.swatchClass : SPYGLASS_SWATCH_CLASS,
        className ?? 'size-2.5',
      )}
      aria-hidden="true"
    />
  )
}
