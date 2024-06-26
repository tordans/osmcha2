'use client'
import { TouchTarget } from '@app/_components/core/button'
import * as Headless from '@headlessui/react'
import { Bars3Icon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import React, { useState } from 'react'
import { Logo } from './Logo'
import { NavigationMapItemsWrapper } from './NavigationMapItemsWrapper'

type Props = { children: React.ReactNode }

export const NavigationMapWrapper = ({ children }: Props) => {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <>
      {/* Navigaton Flyout */}
      <NavigationMapItemsWrapper open={showSidebar} close={() => setShowSidebar(false)}>
        {children}
      </NavigationMapItemsWrapper>

      {/* Navigation Button */}
      <HeaderNavigationButton
        onClick={() => setShowSidebar(true)}
        aria-label="Open navigation"
        className="rounded-lg"
      >
        <Logo />
        <div className="flex items-center gap-2">
          <Bars3Icon className="size-5" />
          Menu
        </div>
      </HeaderNavigationButton>
    </>
  )
}

export const HeaderNavigationButton = React.forwardRef(function NavbarItem(
  {
    current,
    className,
    children,
    ...props
  }: { current?: boolean; className?: string; children: React.ReactNode } & Omit<
    Headless.ButtonProps,
    'className'
  >,
  ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>,
) {
  const classes = clsx(
    // Base
    'relative flex min-w-0 items-center gap-3 p-2 text-left text-base/6 font-medium text-zinc-950 sm:text-sm/5',
    // Leading icon/icon-only
    'data-[slot=icon]:*:size-6 data-[slot=icon]:*:shrink-0 data-[slot=icon]:*:fill-zinc-500 sm:data-[slot=icon]:*:size-5',
    // Trailing icon (down chevron or similar)
    'data-[slot=icon]:last:[&:not(:nth-child(2))]:*:ml-auto data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-5 sm:data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-4',
    // Hover
    'data-[hover]:bg-zinc-950/5 data-[slot=icon]:*:data-[hover]:fill-zinc-950',
    // Active
    'data-[active]:bg-zinc-950/5 data-[slot=icon]:*:data-[active]:fill-zinc-950',
    // Dark mode
    'dark:text-white dark:data-[slot=icon]:*:fill-zinc-400',
    'dark:data-[hover]:bg-white/5 dark:data-[slot=icon]:*:data-[hover]:fill-white',
    'dark:data-[active]:bg-white/5 dark:data-[slot=icon]:*:data-[active]:fill-white',
  )

  return (
    <header className="relative">
      <Headless.Button
        {...props}
        className={clsx('flex w-full items-center justify-between', classes, className)}
        data-current={current ? 'true' : undefined}
        ref={ref}
      >
        <TouchTarget>{children}</TouchTarget>
      </Headless.Button>
    </header>
  )
})
