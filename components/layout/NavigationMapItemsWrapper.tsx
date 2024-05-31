'use client'
import * as Headless from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import React from 'react'
import { Logo } from './Logo'
import { HeaderNavigationButton } from './NavigationMap'

type Props = React.PropsWithChildren<{ open: boolean; close: () => void }>

export const NavigationMapItemsWrapper = ({ open, close, children }: Props) => {
  return (
    <Headless.Transition show={open}>
      <Headless.Dialog onClose={close}>
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
              <Headless.CloseButton
                as={HeaderNavigationButton}
                aria-label="Close navigation"
                className="px-4 py-3"
              >
                <Logo />
                <div className="flex items-center gap-2">
                  <XMarkIcon className="size-5" />
                </div>
              </Headless.CloseButton>
              {children}
            </div>
          </Headless.DialogPanel>
        </Headless.TransitionChild>
      </Headless.Dialog>
    </Headless.Transition>
  )
}
