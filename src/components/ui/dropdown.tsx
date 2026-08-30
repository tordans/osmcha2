import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import type React from 'react'
import { Button } from './button'
import { flyoutBackdropClassName, flyoutSurfaceClassName } from './flyout.ts'
import { Link } from './link'

/** Shared width for chrome Menu and list Filters; both open as compact drop panels. */
export const chromeDropdownMenuClassName =
  'w-72 max-w-[calc(100vw-1rem)] max-h-[min(32rem,calc(100dvh-5rem))]'

export function Dropdown({
  backdrop = true,
  children,
  ...props
}: { backdrop?: boolean } & Headless.MenuProps) {
  return (
    <Headless.Menu as="div" {...props}>
      {(bag) => (
        <>
          {backdrop && bag.open ? (
            <div aria-hidden className={flyoutBackdropClassName} onClick={() => bag.close()} />
          ) : null}
          {typeof children === 'function' ? children(bag) : children}
        </>
      )}
    </Headless.Menu>
  )
}

export function DropdownButton<T extends React.ElementType = typeof Button>({
  as = Button,
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuButtonProps<T>, 'className'>) {
  return (
    <Headless.MenuButton
      as={as}
      className={clsx('relative z-10 data-open:z-[110]', className)}
      {...props}
    />
  )
}

export function DropdownMenu({
  anchor = 'bottom',
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuItemsProps, 'as' | 'className'>) {
  return (
    <Headless.MenuItems
      {...props}
      transition
      portal
      anchor={anchor}
      className={clsx(
        // Anchor positioning
        '[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)] data-[anchor~=end]:[--anchor-offset:6px] data-[anchor~=start]:[--anchor-offset:-6px] sm:data-[anchor~=end]:[--anchor-offset:4px] sm:data-[anchor~=start]:[--anchor-offset:-4px]',
        // Above review pane (z-30) / debug chips; below open chrome triggers (data-open:z-[110])
        'isolate z-[100] origin-top rounded-xl p-1',
        // Shrink-to-fit labels; callers may override (e.g. chrome `w-72`)
        className ?? 'w-max min-w-max',
        // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
        'outline outline-transparent focus:outline-hidden',
        // Handle scrolling when menu won't fit in viewport
        'overflow-y-auto',
        // Opaque so list debug chips do not show through
        flyoutSurfaceClassName,
        // Shared icon/label/shortcut columns (Catalyst) so rows don't wrap to min-content
        'supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
        // Drop in from the trigger
        'transition duration-200 ease-out data-closed:pointer-events-none data-closed:-translate-y-2 data-closed:scale-95 data-closed:opacity-0 data-leave:duration-150 data-leave:ease-in',
      )}
    />
  )
}

export function DropdownItem({
  className,
  ...props
}: { className?: string } & (
  | ({ href?: never } & Omit<Headless.MenuItemProps<'button'>, 'as' | 'className'>)
  | ({ href: string } & Omit<Headless.MenuItemProps<typeof Link>, 'as' | 'className'>)
)) {
  const classes = clsx(
    className,
    // Base styles
    'group cursor-pointer rounded-lg px-3.5 py-2.5 focus:outline-hidden sm:px-3 sm:py-1.5',
    // Text styles
    'text-left text-base/6 text-zinc-950 sm:text-sm/6 forced-colors:text-[CanvasText]',
    // Focus
    'data-focus:bg-blue-500 data-focus:text-white',
    // Disabled state
    'data-disabled:opacity-50',
    // Forced colors mode
    'forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText] forced-colors:data-focus:*:data-[slot=icon]:text-[HighlightText]',
    // Use subgrid when available but fallback to an explicit grid layout if not
    'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
    // Icons
    '*:data-[slot=icon]:col-start-1 *:data-[slot=icon]:row-start-1 *:data-[slot=icon]:mr-2.5 *:data-[slot=icon]:-ml-0.5 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:mr-2 sm:*:data-[slot=icon]:size-4',
    '*:data-[slot=icon]:text-zinc-500 data-focus:*:data-[slot=icon]:text-white',
    // Avatar
    '*:data-[slot=avatar]:mr-2.5 *:data-[slot=avatar]:-ml-1 *:data-[slot=avatar]:size-6 sm:*:data-[slot=avatar]:mr-2 sm:*:data-[slot=avatar]:size-5',
  )

  if (typeof props.href === 'string') {
    const { href, ...linkProps } = props
    return (
      <Headless.MenuItem<typeof Link> as={Link} href={href} {...linkProps} className={classes} />
    )
  }

  const { href: _href, ...buttonProps } = props
  return (
    <Headless.MenuItem<'button'> as="button" type="button" {...buttonProps} className={classes} />
  )
}

export function DropdownHeader({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx(className, 'col-span-5 px-3.5 pt-2.5 pb-1 sm:px-3')} />
}

export function DropdownSection({
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuSectionProps, 'as' | 'className'>) {
  return (
    <Headless.MenuSection
      {...props}
      className={clsx(
        // Define grid at the section level instead of the item level if subgrid is supported
        'col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
        className,
      )}
    />
  )
}

export function DropdownHeading({
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuHeadingProps, 'as' | 'className'>) {
  return (
    <Headless.MenuHeading
      {...props}
      className={clsx(
        className,
        'col-span-full grid grid-cols-[1fr_auto] gap-x-12 px-3.5 pt-2 pb-1 text-sm/5 font-medium text-zinc-500 sm:px-3 sm:text-xs/5',
      )}
    />
  )
}

export function DropdownDivider({
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuSeparatorProps, 'as' | 'className'>) {
  return (
    <Headless.MenuSeparator
      {...props}
      className={clsx(
        className,
        'col-span-full mx-3.5 my-1 h-px border-0 bg-zinc-950/5 sm:mx-3 forced-colors:bg-[CanvasText]',
      )}
    />
  )
}

export function DropdownLabel({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} data-slot="label" className={clsx(className, 'col-start-2 row-start-1')} />
}

export function DropdownDescription({
  className,
  ...props
}: { className?: string } & Omit<Headless.DescriptionProps, 'as' | 'className'>) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={clsx(
        className,
        'col-span-2 col-start-2 row-start-2 text-sm/5 text-zinc-500 group-data-focus:text-white sm:text-xs/5 forced-colors:group-data-focus:text-[HighlightText]',
      )}
    />
  )
}

export function DropdownShortcut({
  keys,
  className,
  ...props
}: { keys: string | string[]; className?: string } & Omit<
  Headless.DescriptionProps,
  'as' | 'className'
>) {
  return (
    <Headless.Description<'kbd'>
      as="kbd"
      {...props}
      className={clsx(className, 'col-start-5 row-start-1 flex justify-self-end')}
    >
      {(Array.isArray(keys) ? keys : keys.split('')).map((char, index) => (
        <kbd
          key={index}
          className={clsx([
            'min-w-[2ch] text-center font-sans text-zinc-400 capitalize group-data-focus:text-white forced-colors:group-data-focus:text-[HighlightText]',
            // Make sure key names that are longer than one character (like "Tab") have extra space
            index > 0 && char.length > 1 && 'pl-1',
          ])}
        >
          {char}
        </kbd>
      ))}
    </Headless.Description>
  )
}
