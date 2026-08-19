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
      {description ? <Description>{description}</Description> : null}
    </Field>
  )
}
