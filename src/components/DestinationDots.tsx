import type { DestinationDelivery, DestinationId } from '@/api/types'
import { destinationMeta } from '@/lib/labels'
import { cn } from '@/lib/cn'

/** How many marks are drawn before the rest collapse into "+N others". */
const DEFAULT_MAX = 3

/**
 * One destination's mark: the brand logo where we ship one, a coloured
 * initials chip otherwise. The marketplace delivers on hundreds of adtech
 * platforms and most have no published logo, so both forms are first-class.
 */
export function DestinationChip({
  destination,
  title,
  size = 19,
}: {
  destination: DestinationId
  title?: string
  size?: number
}) {
  const meta = destinationMeta(destination)
  const label = title ?? meta.name

  if (meta.logo) {
    return (
      <span
        title={label}
        style={{
          width: size,
          height: size,
          background: meta.logo.hex,
          color: meta.logoColor,
        }}
        className="flex shrink-0 items-center justify-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.62}
          height={size * 0.62}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={meta.logo.path} />
        </svg>
      </span>
    )
  }

  return (
    <span
      title={label}
      style={{ height: size, minWidth: size }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full px-1 text-[9.5px] font-bold',
        meta.className,
      )}
    >
      {meta.glyph}
    </span>
  )
}

export function DestinationDots({
  destinations,
  max = DEFAULT_MAX,
}: {
  destinations: DestinationDelivery[]
  /** Marks drawn before the overflow pill; pass `Infinity` to draw them all. */
  max?: number
}) {
  const shown = destinations.slice(0, max)
  const rest = destinations.slice(shown.length)

  return (
    <div className="flex items-center justify-center gap-1">
      {shown.map((d) => (
        <DestinationChip
          key={d.destination}
          destination={d.destination}
          title={`${destinationMeta(d.destination).name} · ${d.usage.replace('_', ' ')}`}
        />
      ))}
      {rest.length > 0 && (
        <span
          title={rest.map((d) => destinationMeta(d.destination).name).join(', ')}
          className="whitespace-nowrap rounded-full bg-[#EDEFF1] px-1.5 py-[2px] text-[10.5px] font-semibold text-muted"
        >
          +{rest.length} others
        </span>
      )}
    </div>
  )
}
