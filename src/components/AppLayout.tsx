import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'
import { MOCKED_MODULES } from '@/api/client'
import { API_MODULE_LABELS } from '@/api/config'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {MOCKED_MODULES.length > 0 && (
          <div className="shrink-0 border-b border-line bg-amber-soft px-6 py-1.5 text-[11.5px] font-semibold text-amber-ink">
            Mock data:{' '}
            {MOCKED_MODULES.map((m) => API_MODULE_LABELS[m]).join(', ')} — set
            VITE_API_MODE(_MODULE)=live in .env to read from FastAPI
          </div>
        )}
        <Outlet />
      </div>
    </div>
  )
}
