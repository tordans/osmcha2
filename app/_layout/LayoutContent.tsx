import { Logo } from '@app/_layout/Logo'
import { NavigationSidebar } from '@app/_layout/NavigationItems'

type Props = { children: React.ReactNode }

export const LayoutContent = ({ children }: Props) => {
  return (
    <div className="flex h-full gap-3 p-2 pl-0">
      <header className="flex h-full w-72 flex-col">
        <div className="-mb-2 p-2 pl-4">
          <Logo />
        </div>
        <NavigationSidebar />
      </header>
      <div className="h-full p-2 pr-0 lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
        <div className="h-full overflow-y-scroll">
          <main className="mx-auto h-full max-w-6xl">{children}</main>
        </div>
      </div>
    </div>
  )
}
