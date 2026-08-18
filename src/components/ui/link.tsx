import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router'

type LinkProps = { href: string } & Omit<React.ComponentPropsWithoutRef<'a'>, 'href'>

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, className, ...props }: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <Headless.DataInteractive>
      <RouterLink
        {...props}
        to={href}
        ref={ref}
        className={clsx('cursor-pointer touch-manipulation select-none', className)}
      />
    </Headless.DataInteractive>
  )
})
