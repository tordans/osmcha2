'use client'
import { Bars3Icon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { NavbarItem } from '../core/navbar'
import { NavigationSidebar } from './NavigationItems'
import { NavigationMapItemsWrapper } from './NavigationMapItemsWrapper'

export const NavigationMap = () => {
  let [showSidebar, setShowSidebar] = useState(false)

  return (
    <>
      {/* Navigaton Flyout */}
      <NavigationMapItemsWrapper open={showSidebar} close={() => setShowSidebar(false)}>
        <NavigationSidebar />
      </NavigationMapItemsWrapper>

      {/* Navigation Button */}
      <header className="flex items-center">
        <NavbarItem onClick={() => setShowSidebar(true)} aria-label="Open navigation">
          <Bars3Icon />

          <h1 className="-ml-1 text-lg font-normal text-zinc-500">
            <span className="text-blue-500">OSM</span>Cha
          </h1>
        </NavbarItem>
      </header>
    </>
  )
}
