import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'
import { API_MODE } from '@/api/client'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {API_MODE === 'mock' && (
          <div className="shrink-0 border-b border-line bg-amber-soft px-6 py-1.5 text-[11.5px] font-semibold text-amber-ink">
            Mock data — set VITE_API_MODE=live in .env to read from FastAPI
          </div>
        )}
        <Outlet />
      </div>
    </div>
  )
}
