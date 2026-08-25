import type { SellerLabel } from '@/api/types'
import { SELLER_LABEL_META, statusTone } from '@/lib/sellerLabels'
import { cn } from '@/lib/cn'

interface SellerBadgeProps {
  label: SellerLabel
  /** Replaces the label text, e.g. "4 best sellers" on a platform card. */
  text?: string
  muted?: boolean
}

export function SellerBadge({ label, text, muted }: SellerBadgeProps) {
  const meta = SELLER_LABEL_META[label]
  return (
    <span
      className={cn('bdg my-0.5 mr-1', meta.className, muted && 'opacity-40')}
      title={meta.criteria}
    >
      <span className="text-[10px] leading-none">{meta.icon}</span>
      {text ?? meta.text}
    </span>
  )
}

export function AttentionBadge({ count }: { count: number }) {
  return (
    <span className="bdg my-0.5 mr-1 bdg-warn">
      <span className="text-[10px] leading-none">!</span>
      {count} need attention
    </span>
  )
}

export function GhostBadge({ children }: { children: string }) {
  return <span className="bdg my-0.5 mr-1 bdg-ghost">{children}</span>
}

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status)
  return (
    <span
      className={cn(
        'pill ml-auto',
        tone === 'bad' ? 'pill-bad' : tone === 'flat' ? 'pill-flat' : 'pill-ok',
      )}
    >
      {status}
    </span>
  )
}

/** Segment path with the top-level prefix greyed out, as in the mockup. */
export function SegmentPath({
  pathPrefix,
  name,
}: {
  pathPrefix: string
  name: string
}) {
  return (
    <span className="text-[#111]">
      <span className="text-[#6B7280]">{pathPrefix}</span>
      {name}
    </span>
  )
}

export function PlatformMark({
  glyph,
  color,
  size = 20,
}: {
  glyph: string
  color: string
  size?: number
}) {
  return (
    <span
      className="flex items-center justify-center rounded-[5px] font-bold text-white"
      style={{
        background: `#${color}`,
        width: size,
        height: size,
        fontSize: size * 0.6,
      }}
    >
      {glyph}
    </span>
  )
}
