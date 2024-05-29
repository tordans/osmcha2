import { Suspense } from 'react'

export default async function HomePage() {
  const resp = await fetch(
    'https://osmcha.org/api/v1/changesets/?page=1&page_size=25&date__gte=2024-05-27&date__lte=2024-05-29%2019%3A41',
    { headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` } },
  )
  const data = await resp.json()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex">
        <nav className="w-80">xl</nav>
        <main className="flex-1">y</main>
      </div>
      <h1>Hallo {JSON.stringify(data)}</h1>
    </Suspense>
  )
}
