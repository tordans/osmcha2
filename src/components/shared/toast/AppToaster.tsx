import type { CSSProperties } from 'react'
import { Toaster } from 'sonner'

const toastTheme = {
  '--normal-bg': 'var(--color-blue-600)',
  '--normal-text': 'white',
  '--normal-border': 'var(--color-blue-700)',
  '--success-bg': 'var(--color-blue-600)',
  '--success-text': 'white',
  '--success-border': 'var(--color-blue-700)',
  '--info-bg': 'var(--color-blue-50)',
  '--info-text': 'var(--color-blue-950)',
  '--info-border': 'var(--color-blue-200)',
} as CSSProperties

/** App-wide toast host — mount once next to the router. */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      style={toastTheme}
      toastOptions={{
        classNames: {
          toast: 'font-sans shadow-lg',
          content: '!flex-row !flex-wrap !items-baseline !gap-x-1.5 !gap-y-0',
          title: '!font-semibold shrink-0',
          description: '!font-normal !opacity-80',
        },
      }}
    />
  )
}
