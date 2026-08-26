import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
