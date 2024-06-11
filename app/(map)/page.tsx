import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import { ParamFilters } from './_layout/ParamFilters.zod'
import { ParamOrderBy } from './_layout/ParamOrderBy.zod'
import { ParamPage } from './_layout/ParamPage.zod copy'
import { searchParamsCache } from './_layout/searchParams'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { filters, orderBy, page } = searchParamsCache.parse(searchParams)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex-1 overflow-y-auto p-10">
        <h1 className="flex items-center gap-1 text-4xl font-thin">
          <ArrowLeftIcon className="size-10" /> Start by selecting a changeset…
        </h1>
        <div className="mt-10 rounded bg-pink-100 p-1">
          <p>Current Filters Raw</p>
          <pre>{JSON.stringify(filters, undefined, 2)}</pre>
          <p>Current Filters Parsed</p>
          <pre>{JSON.stringify(ParamFilters.parse(filters), undefined, 2)}</pre>
          <p>Order By Raw</p>
          <pre>{JSON.stringify(orderBy, undefined, 2)}</pre>
          <p>Order By Parsed</p>
          <pre>{JSON.stringify(ParamOrderBy.parse(orderBy), undefined, 2)}</pre>
          <p>Page Raw</p>
          <pre>{JSON.stringify(page, undefined, 2)}</pre>
          <p>Page Parsed</p>
          <pre>{JSON.stringify(ParamPage.parse(page), undefined, 2)}</pre>
        </div>
      </div>
    </Suspense>
  )
}
