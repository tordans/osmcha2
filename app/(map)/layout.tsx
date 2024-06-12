import { LayoutMap } from '../_layout/LayoutMap'

export default async function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Layouts in NextJS are very special.
  // For now, we use a server component as a wrapper instead.
  // See https://github.com/47ng/nuqs/discussions/572#discussioncomment-9731905 for more.
  // We might want ot move this back later.
  return <LayoutMap>{children}</LayoutMap>
}
