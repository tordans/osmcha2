import { useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { panelOriginName, readPanelOrigin } from './panelOrigin.ts'

const spring = { type: 'spring' as const, duration: 0.4, bounce: 0.12 }

export function PanePresence({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const name = panelOriginName(pathname)
  const live = name != null
  const reduceMotion = useReducedMotion()
  const from = readPanelOrigin(name)

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        className="h-full min-h-0 min-w-0"
        initial={
          live && !reduceMotion
            ? { opacity: 0, x: from.x, scale: 0.98 }
            : live
              ? { opacity: 0 }
              : false
        }
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={
          live && !reduceMotion
            ? { opacity: 0, x: from.x, scale: 0.98 }
            : live
              ? { opacity: 0 }
              : undefined
        }
        transition={spring}
        style={{ transformOrigin: from.origin }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
