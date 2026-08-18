import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { Button } from '../ui/button.tsx'
import { Dialog, DialogActions, DialogBody, DialogTitle } from '../ui/dialog.tsx'
import { areDebugPanelsEnabled } from './areDebugPanelsEnabled.ts'
import { JsonDump } from './JsonDump.tsx'

type Props = {
  title: string
  data: unknown
}

export function DebugDataHelperDialog(props: Props) {
  if (!areDebugPanelsEnabled()) return null
  return <DebugDataHelperDialogActive {...props} />
}

function DebugDataHelperDialogActive({ title, data }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="pointer-events-none absolute right-1 bottom-1 z-10 print:hidden">
        <div className="rounded-full border border-white/70 bg-pink-300 p-0.5 text-xs shadow-xl">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setIsOpen(true)
            }}
            className="pointer-events-auto relative flex size-5 items-center justify-center rounded-full bg-white/50 hover:bg-white"
            aria-label={`Inspect ${title}`}
          >
            <MagnifyingGlassIcon className="size-3" />
          </button>
        </div>
      </div>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} size="4xl">
        <DialogTitle>{title}</DialogTitle>
        <DialogBody>
          <JsonDump data={data} />
        </DialogBody>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
