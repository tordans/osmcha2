import type { LucideIcon } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

/** Matches Catalyst `sm:text-sm/6 font-semibold` stroke at `size-4`. */
export const ICON_STROKE_WIDTH = 1.5

export type IconVariant = 'outline' | 'fill'

export type AppIconProps = Omit<ComponentPropsWithoutRef<'svg'>, 'strokeWidth'> & {
  variant?: IconVariant
  size?: number | string
  strokeWidth?: number | string
  absoluteStrokeWidth?: boolean
}

/**
 * Wrap a Lucide glyph with OSMCha defaults: `data-slot="icon"`, thin outline,
 * or filled for status/info. Callers may override `strokeWidth` / `fill`.
 */
export function appIcon(Glyph: LucideIcon) {
  function AppIcon({ variant = 'outline', strokeWidth, fill, ...props }: AppIconProps) {
    const isFill = variant === 'fill'
    return (
      <Glyph
        data-slot="icon"
        strokeWidth={strokeWidth ?? (isFill ? 0 : ICON_STROKE_WIDTH)}
        fill={fill ?? (isFill ? 'currentColor' : 'none')}
        {...props}
      />
    )
  }
  AppIcon.displayName = Glyph.displayName ?? Glyph.name
  return AppIcon
}
