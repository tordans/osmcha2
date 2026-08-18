import { GlobeAltIcon } from '@heroicons/react/24/solid'
import { isOsmOAuthHost } from '../utils/auth.ts'
import { SignInButton } from './changeset/sign_in_button.tsx'
import { TokenImport } from './token_import.tsx'

export function SignIn() {
  const localOAuth = isOsmOAuthHost()

  return (
    <div className="flex h-full flex-col items-center justify-center bg-zinc-50 px-4">
      <GlobeAltIcon className="size-24 text-zinc-400" />
      <p className="mt-3 text-center text-base font-semibold text-zinc-950">
        {localOAuth
          ? 'Sign in with your OpenStreetMap account to use OSMCha.'
          : 'Paste your OSMCha API token to use OSMCha.'}
      </p>
      <div className="mt-6">
        {localOAuth ? <SignInButton text="Sign in" /> : <TokenImport />}
      </div>
    </div>
  )
}
