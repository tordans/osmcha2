import { TailwindResponsiveHelper } from '@components/core/TailwindResponsiveHelper'
import { StackedLayout } from '@components/layout/StackedLayout'
import { clsx } from 'clsx'
import type { Metadata } from 'next'
import { Open_Sans } from 'next/font/google'
import './globals.css'

const openSans = Open_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OSMChat 2.0',
  description: 'TODO',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full bg-white lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
      <body className={clsx(openSans.className, 'min-h-full w-full antialiased')}>
        <StackedLayout>{children}</StackedLayout>
        <TailwindResponsiveHelper />
      </body>
    </html>
  )
}
