import type React from 'react'
import { Button } from '../ui/button.tsx'

interface UserOSMLinkProps {
  userName?: string
  linkClasses?: string
  children: React.ReactNode
}

export const UserOSMLink = ({ userName, linkClasses, children }: UserOSMLinkProps) => {
  if (!userName) return null

  const url = `https://www.openstreetmap.org/user/${userName}`

  if (linkClasses) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in OSM"
        className={linkClasses}
      >
        {children}
      </a>
    )
  }

  return (
    <Button
      outline
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in OSM"
      className="min-h-11 cursor-pointer touch-manipulation select-none"
    >
      {children}
    </Button>
  )
}
