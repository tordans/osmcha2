import { BugAntIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { Button } from '../ui/button.tsx'
import { Dialog, DialogActions, DialogBody, DialogTitle } from '../ui/dialog.tsx'
import { Tooltip } from '../ui/tooltip.tsx'
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
  const inspectLabel = `Inspect ${title}`

  return (
    <>
      <div className="pointer-events-none absolute right-0.5 bottom-0.5 z-0 print:hidden">
        <Tooltip
          content={inspectLabel}
          className="pointer-events-auto size-4 justify-center rounded-full bg-pink-300 text-pink-950 shadow-sm hover:bg-pink-200"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setIsOpen(true)
          }}
        >
          <BugAntIcon className="size-2.5" />
        </Tooltip>
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
