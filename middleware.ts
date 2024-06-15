import { BASE_PATH, auth } from '@app/_components/auth/nextAuth'
import { NextResponse } from 'next/server'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export default auth((request) => {
  if (request.auth?.user?.id) {
    return
  }

  const reqUrl = new URL(request.url)
  const redirectUrl = new URL(`${BASE_PATH}/signin`, request.url)
  redirectUrl.searchParams.append('callbackUrl', reqUrl.pathname)
  console.log('aaa', redirectUrl.toJSON())
  return NextResponse.redirect(redirectUrl)
})
