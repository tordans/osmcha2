import { useState } from 'react'
import { Input } from '../ui/input.tsx'
import { filterOptionLabel, type Filter } from './filterTypes.ts'

type TextProps = {
  name: string
  display: string
  type: string
  placeholder?: string
  value?: Filter
  className?: string
  onChange: (name: string, value?: Filter | null) => void
  min?: string | number
  max?: string | number
}

export function Text({
  name,
  display,
  type,
  placeholder,
  value,
  className,
  onChange,
  min,
  max,
}: TextProps) {
  const [isValid, setIsValid] = useState(true)
  const raw = value?.[0]?.value
  const inputValue = raw == null ? '' : filterOptionLabel(raw)

  return (
    <Input
      name={name}
      className={className}
      value={inputValue}
      type={type === 'number' ? 'number' : 'text'}
      placeholder={placeholder || display}
      min={min}
      max={max}
      invalid={!isValid}
      onChange={(event) => {
        const next = event.target.value
        setIsValid(event.target.validity.valid)
        if (!next) {
          onChange(name)
          return
        }
        onChange(name, [{ label: next, value: next }])
      }}
    />
  )
}
