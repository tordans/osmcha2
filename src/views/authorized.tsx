import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { completeOAuthLogin } from '../utils/auth.ts'

const oauthCodesStarted = new Set<string>()

export function Authorized() {
  const navigate = useNavigate()
  const searchStr = useRouterState({ select: (state) => state.location.searchStr })

  useEffect(
    function completeOAuthFromRedirect() {
      const params = new URLSearchParams(searchStr)
      const authCode = params.get('code')

      if (!authCode) {
        void navigate({ to: '/', replace: true })
        return
      }

      if (oauthCodesStarted.has(authCode)) return
      oauthCodesStarted.add(authCode)

      completeOAuthLogin(authCode)
        .then(() => {
          void navigate({ to: '/', replace: true })
        })
        .catch((error) => {
          console.error('OAuth completion failed:', error)
          void navigate({ to: '/', replace: true })
        })
    },
    [searchStr, navigate],
  )

  return <div className="center">Logging in...</div>
}
