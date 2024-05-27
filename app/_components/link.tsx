import * as Headless from '@headlessui/react'
import NextLink, { type LinkProps } from 'next/link'
import React from 'react'

export const Link = React.forwardRef(function Link<R extends string>(
  props: LinkProps<R> & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Headless.DataInteractive>
      <NextLink {...props} ref={ref} />
    </Headless.DataInteractive>
  )
})
