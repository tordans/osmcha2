/** Hairline + even glow. Keep overflow-hidden off this node so the ring is not clipped. */
export const paneCardClassName =
  'min-[56rem]:rounded-lg min-[56rem]:bg-white min-[56rem]:shadow-[0_0_16px_rgb(24_24_27_/_0.16),0_4px_12px_rgb(24_24_27_/_0.08)] min-[56rem]:ring-1 min-[56rem]:ring-zinc-950/5'

/** Clip pane body to the card radius. */
export const paneCardClipClassName = 'min-h-0 min-w-0 overflow-hidden min-[56rem]:rounded-[inherit]'
