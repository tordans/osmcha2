import { Suspense } from 'react'

export default async function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex-1 overflow-y-auto">Select a changeset…</div>
    </Suspense>
  )
}
