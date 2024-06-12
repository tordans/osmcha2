import { LayoutMap } from '../_layout/LayoutMap'

export default async function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Layouts in NextJS are very special. Which is why we use a server component to handle the layout instead.
  // One thing they do: Once I use `writeDebugFile` in a component that is imported in a laoyut, this helper fails because "import fs" cannot be found anymore.
  // Other issues are https://github.com/47ng/nuqs/discussions/572#discussioncomment-9731905
  return <LayoutMap>{children}</LayoutMap>
}
