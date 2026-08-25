import type { PlatformPerformance } from '@/api/types'
import { AttentionBadge, PlatformMark, SellerBadge, StatusPill } from './SellerBadge'
import { formatUsdCompact, statusTone } from '@/lib/sellerLabels'
import { formatNumber } from '@/lib/labels'
import { cn } from '@/lib/cn'

const BORDER: Record<'ok' | 'bad' | 'flat', string> = {
  ok: '#00A05A',
  bad: '#E0392B',
  flat: '#9AA0A6',
}

interface Props {
  platforms: PlatformPerformance[]
  openId: string | null
  onToggle: (id: string) => void
}

export function PlatformGrid({ platforms, openId, onToggle }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3.5 max-[1500px]:grid-cols-2">
      {platforms.map((p) => (
        <button
          key={p.id}
          aria-expanded={openId === p.id}
          onClick={() => onToggle(p.id)}
          style={{ borderLeft: `5px solid ${BORDER[statusTone(p.status)]}` }}
          className={cn(
            'rounded-md border border-line bg-white px-4 py-3.5 text-left transition-shadow',
            openId === p.id
              ? 'border-green-deep shadow-[0_0_0_2px_#DFF6E9]'
              : 'hover:shadow-[0_3px_12px_rgba(16,24,40,.10)]',
          )}
        >
          <div className="flex items-center gap-2.5">
            <PlatformMark glyph={p.glyph} color={p.color} size={22} />
            <b className="text-[15px]">{p.name}</b>
            <StatusPill status={p.status} />
          </div>
          <div className="mb-1.5 mt-[11px] text-[17px] font-semibold">
            {formatNumber(p.activeSegments)} Active Segments
          </div>
          <div className="text-[12px] text-muted">
            {formatUsdCompact(p.revenueLastMonth)} last reported month · {p.growth}
          </div>
          <div className="mt-2.5 border-t border-line2 pt-2">
            <SellerBadge label="best_seller" text={`${p.bestSellers} best sellers`} />
            {p.needAttention > 0 && <AttentionBadge count={p.needAttention} />}
          </div>
          <div className="mt-2 text-[11.5px] font-bold text-indigo">
            {openId === p.id ? 'Hide segments ▴' : 'View segment labels ▾'}
          </div>
        </button>
      ))}
    </div>
  )
}
