'use client'

import * as Headless from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid'
import React, { useState } from 'react'
import { NavbarItem } from '../core/navbar'
import { NavigationHorizontal } from './NavigationHorizontal'
import { NavigationSidebar } from './NavigationSidebar'

function MobileSidebar({
  open,
  close,
  children,
}: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
  return (
    <Headless.Transition show={open}>
      <Headless.Dialog onClose={close} className="lg:hidden">
        <Headless.TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Headless.TransitionChild>
        <Headless.TransitionChild
          enter="ease-in-out duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Headless.DialogPanel className="fixed inset-y-0 w-full max-w-80 p-2 transition">
            <div className="flex h-full flex-col rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
              <div className="-mb-3 px-4 pt-3">
                <Headless.CloseButton as={NavbarItem} aria-label="Close navigation">
                  <XMarkIcon />
                </Headless.CloseButton>
              </div>
              {children}
            </div>
          </Headless.DialogPanel>
        </Headless.TransitionChild>
      </Headless.Dialog>
    </Headless.Transition>
  )
}

export function StackedLayout({ children }: React.PropsWithChildren<{}>) {
  let [showSidebar, setShowSidebar] = useState(false)

  return (
    <>
      {/* Navigaton on mobile: Sidebar  */}
      <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
        <NavigationSidebar />
      </MobileSidebar>

      {/* Navigation on desktop: Navbar */}
      <header className="flex items-center">
        <div className="py-2.5 lg:hidden">
          <NavbarItem onClick={() => setShowSidebar(true)} aria-label="Open navigation">
            <Bars3Icon />

            <h1 className="-ml-1 text-lg font-normal text-zinc-500">
              <span className="text-blue-500">OSM</span>Cha
            </h1>
          </NavbarItem>
        </div>
        <div className="min-w-0 flex-1">
          <NavigationHorizontal />
        </div>
        {/* replace with:
          <NavigationHorizontal /> <-- w-full
         */}
      </header>

      {/* Content */}
      <main className="flex flex-1 grow flex-col overflow-hidden pb-2 lg:px-2">{children}</main>
    </>
  )
}
