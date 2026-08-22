import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { withoutOAuthCallbackSearch } from '../routing/searchSchemas.ts'
import { completeOAuthLogin } from '../utils/auth.ts'

const oauthCodesStarted = new Set<string>()

export function Authorized() {
  const navigate = useNavigate()
  const searchStr = useRouterState({ select: (state) => state.location.searchStr })

  useEffect(
    function completeOAuthFromRedirect() {
      const params = new URLSearchParams(searchStr)
      const authCode = params.get('code')

      const goHome = () => {
        void navigate({
          to: '/',
          search: (prev) => withoutOAuthCallbackSearch(prev),
          replace: true,
        })
      }

      if (!authCode) {
        goHome()
        return
      }

      if (oauthCodesStarted.has(authCode)) return
      oauthCodesStarted.add(authCode)

      completeOAuthLogin(authCode)
        .then(goHome)
        .catch((error) => {
          console.error('OAuth completion failed:', error)
          goHome()
        })
    },
    [searchStr, navigate],
  )

  return <div className="center">Logging in...</div>
}
