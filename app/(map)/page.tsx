import { Suspense } from 'react'

export default async function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex">
        <nav className="w-80">xl</nav>
        <main className="flex-1">y</main>
      </div>
    </Suspense>
  )
}
