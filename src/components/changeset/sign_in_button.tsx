import { getAuthUrl } from '../../network/auth.ts'
import { isOsmOAuthHost } from '../../utils/auth.ts'
import { TokenImport } from '../token_import.tsx'
import { Button } from '../ui/button.tsx'

interface SignInButtonProps {
  text: string
}

function SignInButton({ text }: SignInButtonProps) {
  if (!isOsmOAuthHost()) {
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
      className="w-full max-w-56 text-center leading-snug"
    >
      <span className="text-balance">{text}</span>
    </Button>
  )
}

export { SignInButton }
