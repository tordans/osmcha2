import { useRouterState } from '@tanstack/react-router'
import { RouterLink } from '../routing/RouterLink.tsx'

export function NotFound() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-950">Page not found</h1>
      <p className="text-sm text-zinc-600">
        There's nothing at <code className="font-mono">{pathname}</code>.
      </p>
      <RouterLink to="/" className="mt-2 text-sm font-semibold text-zinc-950 underline">
        Go to the changeset list
      </RouterLink>
    </div>
  )
}
