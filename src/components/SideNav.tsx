import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface NavGroup {
  icon: string
  title: string
  green?: boolean
  items: { label: string; to?: string }[]
}

const GROUPS: NavGroup[] = [
  { icon: '⇩', title: 'Data In', items: [{ label: 'Upload File' }, { label: 'Files' }] },
  {
    icon: '▤',
    title: 'Marketplace',
    green: true,
    items: [
      { label: 'Manage Partnerships' },
      { label: 'Sell Data' },
      { label: 'Storefront' },
      { label: 'Buy Data', to: '/segments' },
    ],
  },
  {
    icon: '▩',
    title: 'Data Management',
    items: [{ label: 'Audiences' }, { label: 'Lookalike Models' }, { label: 'Segments' }],
  },
  {
    icon: '⇗',
    title: 'Data Out',
    items: [{ label: 'Destination Accounts' }, { label: 'New Destination Account' }],
  },
]

export function SideNav() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    'Data In': true,
    Marketplace: true,
    'Data Management': true,
    'Data Out': true,
  })

  return (
    <aside className="flex w-[264px] shrink-0 flex-col overflow-y-auto bg-black pb-2 text-white">
      <div className="flex items-center gap-2.5 px-[18px] pb-3.5 pt-5">
        <span className="text-[17px] font-bold tracking-tighter">/L</span>
        <b className="text-[19px] font-bold">LiveRamp</b>
        <span className="ml-auto h-[15px] w-[15px] rounded-[3px] border-2 border-white opacity-85" />
      </div>

      <div className="mx-[18px] mb-4 mt-1 flex">
        <button className="flex-1 rounded-l-[5px] bg-green px-4 py-2.5 text-center text-[14.5px] font-bold text-[#04331E] transition-opacity hover:opacity-90">
          Build Segment
        </button>
        <button className="rounded-r-[5px] border-l border-black/20 bg-green px-2.5 text-[11px] text-[#04331E] transition-opacity hover:opacity-90">
          ▾
        </button>
      </div>

      <div className="flex items-center gap-2.5 px-[18px] py-2 text-[14.5px] font-semibold">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] bg-[#2B2D31] text-[11px]">
          D
        </span>
        DNQE-TEST-CUSTOMER
        <span className="ml-auto text-[9px] opacity-70">▾</span>
      </div>
      <div className="bg-[#2A2C30] py-[7px] pl-[50px] pr-[18px] text-[13.5px] text-[#D6D8DB]">
        Open in Admin
      </div>

      <NavItemTop icon="⌕" label="Search" />
      <NavItemTop icon="▦" label="Dashboard" />

      {GROUPS.map((group) => (
        <div key={group.title}>
          <button
            onClick={() => setOpen((o) => ({ ...o, [group.title]: !o[group.title] }))}
            className={cn(
              'flex w-full items-center gap-3 px-[18px] py-[11px] text-[15px] font-semibold',
              group.green ? 'text-green-nav' : 'text-white',
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center text-sm opacity-90">
              {group.icon}
            </span>
            {group.title}
            <span className="ml-auto text-[9px] opacity-70">
              {open[group.title] ? '▴' : '▾'}
            </span>
          </button>
          {open[group.title] &&
            group.items.map((item) =>
              item.to ? (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'block py-[7px] pl-[50px] pr-[18px] text-[13.5px]',
                      isActive
                        ? 'bg-green-mint font-semibold text-[#03301C]'
                        : 'text-[#E7E8EA] hover:bg-white/5',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ) : (
                <div
                  key={item.label}
                  className="cursor-default py-[7px] pl-[50px] pr-[18px] text-[13.5px] text-[#E7E8EA] hover:bg-white/5"
                >
                  {item.label}
                </div>
              ),
            )}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-3 bg-[#2A2C30] px-[18px] py-3.5 text-[15px] font-semibold">
        <span className="h-5 w-5 text-center">⚙</span>Administration
        <span className="ml-auto text-[9px] opacity-70">▴</span>
      </div>
    </aside>
  )
}

function NavItemTop({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex cursor-default items-center gap-3 px-[18px] py-[11px] text-[15px] font-semibold hover:bg-white/5">
      <span className="flex h-5 w-5 items-center justify-center text-sm opacity-90">
        {icon}
      </span>
      {label}
    </div>
  )
}
