namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_APP_ENV: 'staging' | 'production' | 'development'
    readonly NEXT_PUBLIC_ENABLE_DEBUG_PANELS: 'true' | 'false'
    readonly NEXT_PUBLIC_TEMPORARY_USER_TOKE: string
    readonly OSMCHA_CLIENT_ID: string
    readonly OSMCHA_CLIENT_SECRET: string
    readonly NEXTAUTH_SECRET: string
  }
}
