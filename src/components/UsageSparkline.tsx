import type { UsagePoint } from '@/api/types'
import { cn } from '@/lib/cn'

export function UsageSparkline({ points }: { points: UsagePoint[] }) {
  const peak = Math.max(...points.map((p) => p.index), 1)

  // The marketplace catalogue is a point-in-time distribution snapshot, with no
  // month-by-month series to plot.
  if (points.length === 0) {
    return (
      <div className="mt-1.5 flex h-[72px] items-center justify-center rounded-[6px] border border-dashed border-line text-[12px] text-muted2">
        Month-by-month usage is not reported for this segment
      </div>
    )
  }

  return (
    <div>
      <div className="mt-1.5 flex h-[72px] items-end gap-[5px]">
        {points.map((p) => (
          <div
            key={p.period}
            title={`${p.period}: ${p.index} index`}
            style={{ height: `${(p.index / peak) * 100}%` }}
            className={cn(
              'flex-1 rounded-t-[2px] transition-colors',
              p.index >= peak * 0.8 ? 'bg-green-deep' : 'bg-[#DDF3E7]',
            )}
          />
        ))}
      </div>
      <div className="mt-[5px] flex gap-[5px] text-[10.5px] text-[#9AA0A6]">
        {points.map((p) => (
          <span key={p.period} className="flex-1 text-center">
            {p.period}
          </span>
        ))}
      </div>
    </div>
  )
}
