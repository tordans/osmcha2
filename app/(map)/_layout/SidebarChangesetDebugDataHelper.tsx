'use client'
import { useState } from 'react'
// https://github.com/YYsuni/react18-json-view
import { Button } from '@components/core/button'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@components/core/dialog'
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'
import { TOsmChaChangesets } from '../_components/Changeset/zod/OsmChaChangesets.zod'

type Props = {
  osmChaChangeset?: TOsmChaChangesets['features'][number]
}

export const SidebarChangesetDebugDataHelper = ({ osmChaChangeset }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="absolute bottom-1 right-1 z-10 flex flex-col rounded-full border border-white/70 bg-pink-300 p-0.5 text-xs shadow-xl print:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex size-5 items-center justify-center rounded-full bg-white/50 hover:bg-white"
        >
          <MagnifyingGlassIcon className="size-3" />
        </button>
      </div>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>OSMCha Changeset from OMSCha Changeset List</DialogTitle>
        <DialogDescription>
          This changeset from the list API is different from the changeset/id API.
        </DialogDescription>
        <DialogBody>
          <JsonView src={osmChaChangeset} theme="vscode" />
        </DialogBody>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
