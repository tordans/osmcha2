import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router'

type LinkProps = { href: string } & Omit<React.ComponentPropsWithoutRef<'a'>, 'href'>

function isExternalHref(href: string) {
  return /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:')
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, className, ...props }: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const classes = clsx('cursor-pointer touch-manipulation select-none', className)

  if (isExternalHref(href)) {
    return (
      <Headless.DataInteractive>
        <a {...props} href={href} ref={ref} className={classes} />
      </Headless.DataInteractive>
    )
  }

  return (
    <Headless.DataInteractive>
      <RouterLink {...props} to={href} ref={ref} className={classes} />
    </Headless.DataInteractive>
  )
})
