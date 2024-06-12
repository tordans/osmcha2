import { NavigationMapWrapper } from '@app/_layout/NavigationMapWrapper'
import { Sidebar } from '../(map)/_layout/Sidebar'
import { NavigationSidebar } from './NavigationItems'

type Props = { children: React.ReactNode }

export const LayoutMap = ({ children }: Props) => {
  return (
    <div className="flex h-full gap-3 p-2">
      <div className="relative isolate flex h-full w-72 flex-col gap-2">
        <NavigationMapWrapper>
          <NavigationSidebar />
        </NavigationMapWrapper>
        <nav className="overflow-clip p-0 lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
          <Sidebar />
        </nav>
      </div>
      <main className="flex-1 overflow-clip lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
        {children}
      </main>
    </div>
  )
}
