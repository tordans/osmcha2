import { useState } from 'react'
import { toast } from 'sonner'
import { getAuthUrl } from '../../network/auth.ts'
import { Button } from '../ui/button.tsx'

interface SignInButtonProps {
  text: string
}

function SignInButton({ text }: SignInButtonProps) {
  const [pending, setPending] = useState(false)

  const handleLoginClick = async () => {
    if (pending) return
    setPending(true)
    try {
      const res = await getAuthUrl()
      window.location.assign(res.auth_url)
    } catch {
      toast.error('Could not start the sign-in. Please try again.')
      setPending(false)
    }
  }

  return (
    <Button
      onClick={() => void handleLoginClick()}
      disabled={pending}
      aria-busy={pending}
      className="min-w-56 text-center leading-snug"
    >
      <span className="text-balance">{text}</span>
    </Button>
  )
}

export { SignInButton }
