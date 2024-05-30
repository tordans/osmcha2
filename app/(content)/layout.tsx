export default function ContentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="h-full p-2 pr-0 lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
      <div className="h-full overflow-y-scroll">
        <div className="mx-auto h-full max-w-6xl">{children}</div>
      </div>
    </div>
  )
}
