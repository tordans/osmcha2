import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import NextLink, { type LinkProps } from 'next/link'
import React from 'react'

export const Link = React.forwardRef(function Link<R extends string>(
  {
    className,
    textLink,
    ...props
  }: { className?: string; textLink?: boolean } & LinkProps<R> &
    Omit<React.ComponentPropsWithoutRef<'a'>, 'href'>,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <Headless.DataInteractive>
      <NextLink
        {...props}
        ref={ref}
        className={clsx(
          textLink
            ? 'text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-blue-600 hover:decoration-2'
            : '',
          className,
        )}
      />
    </Headless.DataInteractive>
  )
})
