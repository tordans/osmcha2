import { getAuthUrl } from '../../network/auth.ts'
import { Button } from '../ui/button.tsx'

interface SignInButtonProps {
  text: string
}

function SignInButton({ text }: SignInButtonProps) {
  const handleLoginClick = () => {
    void getAuthUrl().then((res) => {
      window.location.assign(res.auth_url)
    })
  }

  return (
    <Button onClick={handleLoginClick} className="min-w-56 text-center leading-snug">
      <span className="text-balance">{text}</span>
    </Button>
  )
}

export { SignInButton }
