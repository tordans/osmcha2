import { useOsmOAuthAvailable } from '../hooks/useOsmOAuthAvailable.ts'
import { SignInButton } from './changeset/sign_in_button.tsx'
import { TokenImport } from './token_import.tsx'
import { GlobeAltIcon } from './ui/icons.ts'

export function SignIn() {
  const localOAuth = useOsmOAuthAvailable()

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto bg-zinc-50 px-4 py-8">
      <div className="my-auto flex w-full max-w-md flex-col items-center">
        <GlobeAltIcon variant="fill" className="size-24 text-zinc-400" />
        <p className="mt-3 text-center text-base font-semibold text-zinc-950">
          {localOAuth
            ? 'Sign in with your OpenStreetMap account to use OSMCha.'
            : 'Paste your OSMCha API token to use OSMCha.'}
        </p>
        <div className="mt-6 w-full">
          {localOAuth ? <SignInButton text="Sign in" /> : <TokenImport />}
        </div>
      </div>
    </div>
  )
}
