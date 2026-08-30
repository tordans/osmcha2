import type { Icon as PhosphorIcon, IconProps, IconWeight } from '@phosphor-icons/react'
import type { ComponentPropsWithoutRef } from 'react'

/**
 * `outline` → Phosphor `regular` (buttons / controls).
 * `fill` → Phosphor `duotone` (status / non-action indicators).
 */
export type IconVariant = 'outline' | 'fill'

export type AppIconProps = Omit<ComponentPropsWithoutRef<'svg'>, 'ref'> & {
  variant?: IconVariant
  size?: IconProps['size']
  color?: IconProps['color']
  mirrored?: boolean
  weight?: IconWeight
}

function weightForVariant(variant: IconVariant): IconWeight {
  return variant === 'fill' ? 'duotone' : 'regular'
}

/**
 * Wrap a Phosphor glyph with OSMCha defaults: `data-slot="icon"` for Catalyst
 * buttons, regular outline for actions, duotone for status (`variant="fill"`).
 */
export function appIcon(
  Glyph: PhosphorIcon,
  options?: {
    /** Default to duotone (status / badge icons, not button actions). */
    status?: boolean
  },
) {
  function AppIcon({ variant, weight, size, color, mirrored, ...props }: AppIconProps) {
    const resolvedVariant = variant ?? (options?.status ? 'fill' : 'outline')
    return (
      <Glyph
        data-slot="icon"
        weight={weight ?? weightForVariant(resolvedVariant)}
        size={size}
        color={color}
        mirrored={mirrored}
        {...props}
      />
    )
  }
  AppIcon.displayName = Glyph.displayName ?? Glyph.name
  return AppIcon
}
