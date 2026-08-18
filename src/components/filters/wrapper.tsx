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
      <div className="flex items-center gap-2">
        {hasValue ? (
          <span className="size-2.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
        ) : (
          <span className="size-2.5 shrink-0" aria-hidden="true" />
        )}
        <Label className="cursor-pointer select-none">{display}</Label>
      </div>
      <div className="max-w-xl">{children}</div>
      {description ? <Description>{description}</Description> : null}
    </Field>
  )
}
