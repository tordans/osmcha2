import { Link } from '../components/ui/link.tsx'

export function Logo({ search = '' }: { search?: string }) {
  return (
    <Link
      href={search ? `/${search}` : '/'}
      className="cursor-pointer touch-manipulation text-lg font-semibold text-zinc-600 select-none"
    >
      <span className="text-blue-600">OSM</span>Cha
    </Link>
  )
}
