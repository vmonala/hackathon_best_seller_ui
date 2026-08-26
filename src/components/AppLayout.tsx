import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-line bg-amber-soft px-6 py-1.5 text-[11.5px] font-semibold text-amber-ink">
          Fixture data — the marketplace catalogue is a capture of the Segment
          Intelligence API; Data Seller Insights is hand-authored
        </div>
        <Outlet />
      </div>
    </div>
  )
}
