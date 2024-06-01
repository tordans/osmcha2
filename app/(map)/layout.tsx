import { NavigationMap } from '@components/layout/NavigationMap'
import { ChangesetListeSidebar } from './_components/ChangesetListeSidebar'

export default async function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const resp = await fetch(
    'https://osmcha.org/api/v1/changesets/?page=1&page_size=25&date__gte=2024-05-27&date__lte=2024-05-29%2019%3A41',
    { headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` } },
  )
  const data = await resp.json()

  return (
    <div className="flex h-full gap-3 p-2">
      <div className="relative isolate flex h-full w-72 flex-col gap-2">
        <NavigationMap />
        <nav className="overflow-clip p-0 lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
          <ChangesetListeSidebar changesets={data} />
        </nav>
      </div>
      <main className="flex-1 overflow-clip lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
        {children}
      </main>
    </div>
  )
}
