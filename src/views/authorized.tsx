import { getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import { withoutOAuthCallbackSearch } from '../routing/searchSchemas.ts'
import { completeOAuthLogin } from '../utils/auth.ts'

const authorizedRouteApi = getRouteApi('/authorized')
const oauthCodesStarted = new Set<string>()

export function Authorized() {
  const navigate = authorizedRouteApi.useNavigate()
  const { code } = authorizedRouteApi.useSearch()

  useEffect(
    function completeOAuthFromRedirect() {
      const authCode = code?.trim()

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
    [code, navigate],
  )

  return <div className="center">Logging in...</div>
}
