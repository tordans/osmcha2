import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AccountPage } from '../components/secondary_pages_header.tsx'
import { Avatar } from '../components/ui/avatar.tsx'
import { Button } from '../components/ui/button.tsx'
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '../components/ui/description-list.tsx'
import { Divider } from '../components/ui/divider.tsx'
import { Heading, Subheading } from '../components/ui/heading.tsx'
import { CheckIcon, ClipboardIcon } from '../components/ui/icons.ts'
import { Code } from '../components/ui/text.tsx'
import { EditUserDetails } from '../components/user/details.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useAuthStore } from '../stores/authStore.ts'

type UserData = {
  avatar?: string
  username?: string
  id?: string | number
  uid?: string | number
  is_staff?: boolean
}

function CopyTokenButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      plain
      type="button"
      className="min-h-11"
      aria-label="Copy API token"
      title="Copy Authorization Token"
      onClick={() => {
        void navigator.clipboard.writeText(`Token ${token}`).then(() => {
          setCopied(true)
        })
      }}
    >
      {copied ? <CheckIcon data-slot="icon" /> : <ClipboardIcon data-slot="icon" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

export function User() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const initials = currentUser?.username?.slice(0, 2).toUpperCase()

  const handleLogout = () => {
    clearAuth()
    queryClient.clear()
    void navigate({ to: '/' })
  }

  return (
    <AccountPage>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Heading>Account Settings</Heading>
        <Button outline type="button" className="min-h-11" onClick={handleLogout}>
          Logout
        </Button>
      </header>

      <div className="flex items-center gap-4">
        <Avatar src={currentUser?.avatar} initials={initials} alt="" className="size-16" />
        <Heading level={2}>Welcome, {currentUser?.username || 'stranger'}!</Heading>
      </div>

      <Divider soft />

      <section className="flex flex-col gap-4">
        <Subheading>Info</Subheading>
        <DescriptionList>
          <DescriptionTerm>OSMCha ID</DescriptionTerm>
          <DescriptionDetails>{currentUser?.id}</DescriptionDetails>
          <DescriptionTerm>OSM ID</DescriptionTerm>
          <DescriptionDetails>{currentUser?.uid}</DescriptionDetails>
          <DescriptionTerm>Username</DescriptionTerm>
          <DescriptionDetails>{currentUser?.username}</DescriptionDetails>
          {currentUser?.is_staff ? (
            <>
              <DescriptionTerm>Staff</DescriptionTerm>
              <DescriptionDetails>Yes</DescriptionDetails>
            </>
          ) : null}
          <DescriptionTerm>API key</DescriptionTerm>
          <DescriptionDetails>
            <div className="flex flex-wrap items-center gap-2">
              <Code className="break-all">{token ? `Token ${token}` : '—'}</Code>
              {token ? <CopyTokenButton token={token} /> : null}
            </div>
          </DescriptionDetails>
        </DescriptionList>
      </section>

      {token ? (
        <section className="flex flex-col gap-4">
          <Subheading>Review Comments Template</Subheading>
          <EditUserDetails key={String(currentUser?.id ?? 'pending')} />
        </section>
      ) : null}
    </AccountPage>
  )
}
