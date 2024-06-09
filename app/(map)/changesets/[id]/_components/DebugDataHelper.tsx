'use client'
import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import { TOsmChaUser } from '@app/(map)/_components/Changeset/zod/OsmChaUser.zod'
import { TOsmOrgChangeset } from '@app/(map)/_components/Changeset/zod/OsmOrgChangeset.zod'
import { TOsmOrgUser } from '@app/(map)/_components/Changeset/zod/OsmOrgUser.zod'
import { XMarkIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useState } from 'react'
// https://github.com/YYsuni/react18-json-view
import { TOsmChaRealChangesetGeojson } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangesetGeojson.zod'
import { realChangesetParser } from '@components/_lib/real-changesets-parser'
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'

type Props = {
  osmChaChangeset?: TOsmChaChangeset
  osmOrgChangeset?: TOsmOrgChangeset
  osmChaRealChangeset?: TOsmChaRealChangeset
  osmChaRealChangesetGeojson?: TOsmChaRealChangesetGeojson
  osmChaUser?: TOsmChaUser
  osmOrgUser?: TOsmOrgUser
}

export const DebugDataHelper = ({
  osmChaChangeset,
  osmOrgChangeset,
  osmChaRealChangeset,
  osmChaRealChangesetGeojson,
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
            <JsonView src={osmChaChangeset} theme="vscode" />
          </details>

          <details>
            <summary
              className={clsx(
                osmChaRealChangeset ? 'cursor-pointer hover:underline' : 'text-gray-400',
              )}
            >
              OSMCha Real Changeset
            </summary>
            <JsonView src={osmChaRealChangeset} theme="vscode" />
          </details>

          <details>
            <summary
              className={clsx(
                osmChaRealChangesetGeojson ? 'cursor-pointer hover:underline' : 'text-gray-400',
              )}
            >
              OSMCha Real Changeset GeoJson
            </summary>
            <JsonView src={osmChaRealChangesetGeojson} theme="vscode" />
          </details>

          <details>
            <summary
              className={clsx(
                osmChaRealChangeset ? 'cursor-pointer hover:underline' : 'text-gray-400',
              )}
            >
              OSMCha Real Changeset GeoJson – No Zod
            </summary>
            <JsonView src={realChangesetParser(osmChaRealChangeset)} theme="vscode" />
          </details>

          <details>
            <summary
              className={clsx(osmOrgChangeset ? 'cursor-pointer hover:underline' : 'text-gray-400')}
            >
              OSMOrg Changeset
            </summary>
            <JsonView src={osmOrgChangeset} theme="vscode" />
          </details>

          <details>
            <summary
              className={clsx(osmChaUser ? 'cursor-pointer hover:underline' : 'text-gray-400')}
            >
              OSMCha User
            </summary>
            <JsonView src={osmChaUser} theme="vscode" />
          </details>

          <details>
            <summary
              className={clsx(osmOrgUser ? 'cursor-pointer hover:underline' : 'text-gray-400')}
            >
              OSMOrg User
            </summary>
            <JsonView src={osmOrgUser} theme="vscode" />
          </details>
        </>
      )}
    </div>
  )
}
