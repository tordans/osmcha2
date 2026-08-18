import { GlobeAltIcon } from '@heroicons/react/16/solid'
import { getAuthUrl } from '../../network/auth.ts'
import { isLocalOAuthHost } from '../../utils/auth.ts'
import { TokenImport } from '../token_import.tsx'
import { Button } from '../ui/button.tsx'

interface SignInButtonProps {
  text: string
}

function SignInButton({ text }: SignInButtonProps) {
  if (!isLocalOAuthHost()) {
    return <TokenImport />
  }

  const handleLoginClick = () => {
    getAuthUrl().then((res) => {
      window.location.assign(res.auth_url)
    })
  }

  return (
    <Button
      onClick={handleLoginClick}
      className="min-h-11 cursor-pointer touch-manipulation select-none"
    >
      <GlobeAltIcon data-slot="icon" />
      {text}
    </Button>
  )
}

export { SignInButton }
