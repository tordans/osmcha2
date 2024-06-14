import { fetchAoi } from '@app/(map)/_data/fetchAoi'
import { fetchChangesets } from '../../_data/fetchChangesets'
import { DebugDataHelperDialog } from '../debugHelper/DebugDataHelperDialog'
import { SidebarChangeset } from './SidebarChangeset'

export const Sidebar = async () => {
  const osmChaChangesets = await fetchChangesets()
  const osmChaAoi = await fetchAoi()

  return (
    <nav className="group/nav h-full overflow-y-scroll">
      <div className="relative">
        {osmChaAoi && (
          <h1 className="border-b-zinc-400 bg-zinc-100 px-3 py-2 font-semibold">
            Saved Filter: {osmChaAoi.properties.name}
          </h1>
        )}
        <DebugDataHelperDialog data={osmChaAoi} title="AOI Object" />
      </div>
      <ul className="divide-y divide-gray-100">
        {osmChaChangesets.features.map((changeset) => {
          return <SidebarChangeset key={changeset.id} changeset={changeset} />
        })}
      </ul>
    </nav>
  )
}
