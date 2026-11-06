import clsx from 'clsx'
import { LoaderCircleIcon } from './ui/icons.ts'

interface LoadingProps {
  height?: string
  className?: string
}

export function Loading({ height, className = '' }: LoadingProps) {
  return (
    <div
      style={{ height: height || 'auto' }}
      className={clsx(className, 'flex flex-1 flex-col items-center justify-center')}
      role="status"
      aria-label="Loading"
    >
      <LoaderCircleIcon className="size-8 animate-spin text-zinc-400" aria-hidden />
    </div>
  )
}
