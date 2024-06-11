import { DebugDataHelperDialog } from './DebugDataHelperDialog'
import { fetchAoi } from './Sidebar/fetchAoi'
import { fetchChangesets } from './Sidebar/fetchChangesets'
import { SidebarChangeset } from './SidebarChangeset'

export const Sidebar = async () => {
  const osmChaChangesets = await fetchChangesets()
  const osmChaAoi = await fetchAoi()

  return (
    <nav className="group/nav h-full overflow-y-scroll">
      <div className="relative">
        {osmChaAoi && <h1>{osmChaAoi.properties.name}</h1>}
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
