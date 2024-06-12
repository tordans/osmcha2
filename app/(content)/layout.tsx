import { LayoutContent } from '@app/_layout/LayoutContent'

export default function ContentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <LayoutContent>{children}</LayoutContent>
}
