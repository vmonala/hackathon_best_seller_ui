import type { ChannelPerformance } from '@/api/types'
import { AttentionBadge, SellerBadge, StatusPill } from './SellerBadge'
import { statusTone } from '@/lib/sellerLabels'
import { formatNumber } from '@/lib/labels'

const BORDER: Record<'ok' | 'bad' | 'flat', string> = {
  ok: '#00A05A',
  bad: '#E0392B',
  flat: '#9AA0A6',
}

export function ChannelCards({ channels }: { channels: ChannelPerformance[] }) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-3.5">
      {channels.map((c) => (
        <div
          key={c.channel}
          className="rounded-md border border-line bg-white px-[17px] py-[15px]"
          style={{ borderLeft: `5px solid ${BORDER[statusTone(c.status)]}` }}
        >
          <div className="flex items-center">
            <b className="text-[17px]">{c.channel}</b>
            <StatusPill status={c.status} />
          </div>
          <div className="my-3 mb-1.5 text-[19px] font-semibold">
            {formatNumber(c.activeSegments)} Active Segments
          </div>
          <div className="text-[12.5px] text-muted">↗ {c.trend}</div>
          <div className="mt-2.5 border-t border-line2 pt-2">
            <SellerBadge label="best_seller" text={`${c.bestSellers} best sellers`} />
            <AttentionBadge count={c.needAttention} />
          </div>
        </div>
      ))}
    </div>
  )
}
