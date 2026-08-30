/** Floating menus: Catalyst overlay hairline + an even glow (not only a drop shadow). */

/** 10% zinc ring — Catalyst overlay / dialog edge on a dimmed or white surface. */
export const flyoutRingClassName = 'ring-1 ring-zinc-950/10'

/**
 * Wrap-around glow plus a downward lift. `shadow-lg` alone is almost only below the box,
 * so a menu on a white pane has no edge at the top.
 */
export const flyoutShadowClassName =
  'shadow-[0_0_24px_rgb(24_24_27_/_0.22),0_8px_20px_rgb(24_24_27_/_0.14)]'

export const flyoutSurfaceClassName = `bg-white ${flyoutShadowClassName} ${flyoutRingClassName}`

export const flyoutFrostedSurfaceClassName = `bg-white/75 backdrop-blur-xl ${flyoutShadowClassName} ${flyoutRingClassName}`

/** Lighter than Catalyst dialog (`bg-zinc-950/25`) so a menu is not a modal. */
export const flyoutBackdropClassName = 'fixed inset-0 z-[90] bg-zinc-950/20'
