import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Description, Field, Label } from '../ui/fieldset.tsx'

type WrapperProps = {
  display: string
  children: ReactNode
  description?: string | false
  handleFocus?: (name: string) => void
  name: string
  hasValue?: boolean
}

export function Wrapper({
  display,
  children,
  description,
  handleFocus = () => {},
  name,
  hasValue,
}: WrapperProps) {
  return (
    <Field onFocus={() => handleFocus(name)} onClick={() => handleFocus(name)}>
      <Label className="flex cursor-pointer items-center gap-2 select-none">
        <span
          className={hasValue ? 'size-2.5 shrink-0 rounded-full bg-blue-600' : 'size-2.5 shrink-0'}
          aria-hidden="true"
        />
        {display}
      </Label>
      <div data-slot="control" className="max-w-xl">
        {children}
      </div>
      <AnimatePresence>
        {description ? (
          <motion.div
            key="help"
            data-slot="description"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.08 }}
            className="overflow-hidden"
          >
            <Description>{description}</Description>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Field>
  )
}
