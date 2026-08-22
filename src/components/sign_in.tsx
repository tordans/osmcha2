import { BrandMark } from '../layout/Logo.tsx'
import { isOsmOAuthHost } from '../utils/auth.ts'
import { SignInButton } from './changeset/sign_in_button.tsx'
import { TokenImport } from './token_import.tsx'

export function SignIn() {
  const localOAuth = isOsmOAuthHost()

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto bg-zinc-50 px-4 py-8">
      <div className="my-auto flex w-full max-w-md flex-col items-center text-center">
        <BrandMark className="text-3xl font-semibold text-zinc-600" />
        <p className="mt-3 text-base font-semibold text-zinc-950">
          {localOAuth
            ? 'Sign in with your OpenStreetMap account to use OSMCha.'
            : 'Paste your OSMCha API token to use OSMCha.'}
        </p>
        <div className="mt-6 flex w-full justify-center">
          {localOAuth ? <SignInButton text="Sign in" /> : <TokenImport />}
        </div>
      </div>
    </div>
  )
}
