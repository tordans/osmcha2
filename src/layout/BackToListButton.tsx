import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { useLocation } from 'react-router'
import { Button } from '../components/ui/button.tsx'

export function BackToListButton() {
  const location = useLocation()

  return (
    <Button
      color="light"
      href={location.search ? `/${location.search}` : '/'}
      aria-label="Back to list"
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-20 min-h-11 min-w-11 cursor-pointer touch-manipulation select-none min-[56rem]:hidden"
    >
      <ArrowLeftIcon data-slot="icon" className="size-5" />
      List
    </Button>
  )
}
