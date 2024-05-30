'use client'

import { Bars3Icon } from '@heroicons/react/20/solid'
import React, { useState } from 'react'
import { NavbarItem } from '../core/navbar'
import { NavigationHorizontal } from './NavigationHorizontal'
import { NavigationSidebar } from './NavigationSidebar'
import { NavigationSidebarWrapper } from './NavigationSidebarWrapper'

export function LayoutWrapper({ children }: React.PropsWithChildren<{}>) {
  let [showSidebar, setShowSidebar] = useState(false)

  return (
    <>
      {/* Navigaton on mobile: Sidebar  */}
      <NavigationSidebarWrapper open={showSidebar} close={() => setShowSidebar(false)}>
        <NavigationSidebar />
      </NavigationSidebarWrapper>

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
