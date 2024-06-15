import { clsx } from 'clsx'
import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Open_Sans } from 'next/font/google'
import { BASE_PATH, auth } from './_components/auth/nextAuth'
import { TailwindResponsiveHelper } from './_components/core/TailwindResponsiveHelper'
import './globals.css'

const openSans = Open_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OSMChat 2.0',
  description: 'TODO',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <SessionProvider basePath={BASE_PATH} session={session}>
      <html
        lang="en"
        className="h-full bg-white lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950"
      >
        <body
          className={clsx(
            openSans.className,
            'relative isolate flex h-svh w-full flex-col bg-white antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950',
          )}
        >
          {children}
          <TailwindResponsiveHelper />
        </body>
      </html>
    </SessionProvider>
  )
}
