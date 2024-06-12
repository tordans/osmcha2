'use client'
import { useState } from 'react'
// https://github.com/YYsuni/react18-json-view
import { Button } from '@app/_components/core/button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@app/_components/core/dialog'
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'

type Props = {
  title: string
  data: {} | undefined
}

export const DebugDataHelperDialog = ({ title, data }: Props) => {
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
        <DialogTitle>{title}</DialogTitle>
        <DialogBody>
          <JsonView src={data} theme="vscode" />
        </DialogBody>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
