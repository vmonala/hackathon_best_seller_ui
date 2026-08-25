import type { DestinationDelivery } from '@/api/types'
import { DESTINATION_META } from '@/lib/labels'
import { cn } from '@/lib/cn'

export function DestinationDots({
  destinations,
  max = 4,
}: {
  destinations: DestinationDelivery[]
  max?: number
}) {
  const shown = destinations.slice(0, max)
  const overflow = destinations.length - shown.length

  return (
    <div className="flex items-center gap-1">
      {shown.map((d) => {
        const meta = DESTINATION_META[d.destination]
        return (
          <span
            key={d.destination}
            title={`${meta.name} · ${d.usage.replace('_', ' ')}`}
            className={cn(
              'flex h-[19px] w-[19px] items-center justify-center rounded-full text-[9.5px] font-bold',
              meta.className,
            )}
          >
            {meta.glyph}
          </span>
        )
      })}
      {overflow > 0 && (
        <span
          title={destinations
            .slice(max)
            .map((d) => DESTINATION_META[d.destination].name)
            .join(', ')}
          className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-[#EDEFF1] text-[9.5px] font-bold text-muted"
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
