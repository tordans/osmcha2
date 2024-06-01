import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/osmChaChangeset'

type Props = { osmChaChangeset: TOsmChaChangeset }

export const DebugDataHelper = ({ osmChaChangeset }: Props) => {
  return (
    <div className="border-xl fixed right-1 top-1 z-10 flex max-h-[calc(100svh_-_1rem)] overflow-y-auto rounded border border-white/70 bg-pink-300 px-1 text-xs shadow-xl print:hidden">
      <details>
        <summary>Changeset OSMCha</summary>
        <pre>{JSON.stringify(osmChaChangeset, undefined, 2)}</pre>
      </details>
    </div>
  )
}
