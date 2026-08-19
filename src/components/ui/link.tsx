import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { RouterLink } from '../../routing/RouterLink.tsx'

type LinkProps = {
  href: string
  ref?: React.Ref<HTMLAnchorElement>
} & Omit<React.ComponentPropsWithoutRef<'a'>, 'href'>

function isExternalHref(href: string) {
  return /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:')
}

export function Link({ href, className, ref, ...props }: LinkProps) {
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
}
