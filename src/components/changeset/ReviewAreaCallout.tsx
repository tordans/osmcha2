import * as Headless from '@headlessui/react'
import { getRouteApi } from '@tanstack/react-router'
import { useNextChangesetInReviewArea, useReviewArea } from '../../hooks/useReviewArea.ts'
import { searchWithoutMap } from '../../routing/mapParam.ts'
import { Button } from '../ui/button.tsx'
import { ArrowRightIcon, ChevronDownIcon, MapPinIcon } from '../ui/icons.ts'

const rootRouteApi = getRouteApi('__root__')

/**
 * Shown on a changeset whose edits all lie outside the list's location filter. It came into the
 * list only because its bounding box spans the area.
 */
export function ReviewAreaCallout({ changesetId }: { changesetId: number }) {
  const navigate = rootRouteApi.useNavigate()
  const area = useReviewArea()
  const nextId = useNextChangesetInReviewArea(changesetId)

  function skip() {
    if (nextId == null) return
    void navigate({
      to: '/changesets/$id',
      params: { id: nextId },
      search: (prev) => searchWithoutMap(prev),
    })
  }

  return (
    <section
      aria-label="Outside your review area"
      className="mx-2.5 mb-2 rounded-lg bg-amber-50 p-3 text-sm/5 text-amber-950 ring-1 ring-amber-300"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <MapPinIcon className="mt-0.5 size-5 flex-none text-amber-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">Outside your review area</p>
            <p className="text-amber-900">No edit in this changeset touches your area.</p>
          </div>
        </div>
        {nextId != null ? (
          <Button color="amber" className="min-h-11 touch-manipulation sm:min-h-9" onClick={skip}>
            Skip to next
            <ArrowRightIcon />
          </Button>
        ) : null}
      </div>
      <Headless.Disclosure>
        <Headless.DisclosureButton className="group mt-2 flex min-h-11 cursor-pointer touch-manipulation items-center gap-1 text-sm font-medium text-amber-800 select-none hover:text-amber-950 sm:min-h-8">
          Why is this in my list?
          <ChevronDownIcon
            className="size-4 transition-transform group-data-open:rotate-180"
            aria-hidden="true"
          />
        </Headless.DisclosureButton>
        <Headless.DisclosurePanel className="mt-1 space-y-2 text-amber-950">
          <p>
            Your list asks OSMCha for changesets whose <em>bounding box</em> meets your{' '}
            {area?.kind === 'box' ? 'box' : 'area'}. When a mapper edits far-apart places in one
            changeset, say in Paris and in Tokyo, that box spans everything in between, so the
            changeset matches places it never touched.
          </p>
          <p>
            OSMCha only knows the box when it builds the list. Once the edits are loaded, this app
            checks every created, modified and deleted node, way and relation member against your{' '}
            {area?.kind === 'box' ? 'box' : 'exact area shape'}. None of them meets it, so there is
            nothing here for you to review.
          </p>
          <p>
            The “Maximum changeset size” filter option hides big changesets on the server instead,
            but it also hides large edits that do touch your area. Leaving it empty and skipping
            flagged changesets misses nothing.
          </p>
        </Headless.DisclosurePanel>
      </Headless.Disclosure>
    </section>
  )
}
