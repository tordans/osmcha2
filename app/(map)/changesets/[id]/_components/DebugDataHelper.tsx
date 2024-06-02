'use client'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { TOsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { TOsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
import { TOsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'
import { XMarkIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useState } from 'react'

type Props = {
  osmChaChangeset?: TOsmChaChangeset
  osmOrgChangeset?: TOsmOrgChangeset
  osmChaRealChangeset?: TOsmChaRealChangeset
  osmChaUser?: TOsmChaUser
  osmOrgUser?: TOsmOrgUser
}

export const DebugDataHelper = ({
  osmChaChangeset,
  osmOrgChangeset,
  osmChaRealChangeset,
  osmChaUser,
  osmOrgUser,
}: Props) => {
  const [show, setShow] = useState(false)

  return (
    <div className="border-xl fixed right-[50%] top-1 z-10 flex max-h-[calc(100svh_-_1rem)] max-w-prose flex-col overflow-y-auto rounded border border-white/70 bg-pink-300 px-1 py-0.5 text-xs shadow-xl print:hidden">
      <div className="flex justify-end">
        <button
          onClick={() => setShow((prev) => !prev)}
          className="relative flex size-5 items-center justify-center rounded-full bg-white/50 hover:bg-white"
        >
          <XMarkIcon className={clsx('size-3', show ? '' : 'rotate-45')} />
        </button>
      </div>
      {show && (
        <>
          <details>
            <summary
              className={clsx(osmChaChangeset ? 'cursor-pointer hover:underline' : 'text-gray-400')}
            >
              OSMCha Changeset
            </summary>
            <pre>{JSON.stringify(osmChaChangeset, undefined, 2)}</pre>
          </details>
          <details>
            <summary
              className={clsx(
                osmChaRealChangeset ? 'cursor-pointer hover:underline' : 'text-gray-400',
              )}
            >
              OSMCha Real Changeset
            </summary>
            <pre>{JSON.stringify(osmChaRealChangeset, undefined, 2)}</pre>
          </details>
          <details>
            <summary
              className={clsx(osmOrgChangeset ? 'cursor-pointer hover:underline' : 'text-gray-400')}
            >
              OSMOrg Changeset
            </summary>
            <pre>{JSON.stringify(osmOrgChangeset, undefined, 2)}</pre>
          </details>
          <details>
            <summary
              className={clsx(osmChaUser ? 'cursor-pointer hover:underline' : 'text-gray-400')}
            >
              OSMCha User
            </summary>
            <pre>{JSON.stringify(osmChaUser, undefined, 2)}</pre>
          </details>
          <details>
            <summary
              className={clsx(osmOrgUser ? 'cursor-pointer hover:underline' : 'text-gray-400')}
            >
              OSMOrg User
            </summary>
            <pre>{JSON.stringify(osmOrgUser, undefined, 2)}</pre>
          </details>
        </>
      )}
    </div>
  )
}
