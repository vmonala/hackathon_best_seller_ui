import type { ReactNode } from 'react'
import type { SegmentLabel } from '@/api/types'
import { LABEL_META } from '@/lib/labels'
import { cn } from '@/lib/cn'

interface LabelBadgeProps {
  label: SegmentLabel
  short?: boolean
  muted?: boolean
  /**
   * Why *this* segment earned the label, from `Segment.labelReasons`. Shown on
   * hover in place of the label's own wording, which the chip already says.
   * Markdown bold is stripped — a `title` attribute renders no markup.
   */
  reason?: string
  className?: string
}

export function LabelBadge({
  label,
  short,
  muted,
  reason,
  className,
}: LabelBadgeProps) {
  const meta = LABEL_META[label]
  return (
    <span
      className={cn('bdg', meta.className, muted && 'opacity-40', className)}
      title={reason ? plain(reason) : meta.text}
    >
      <span className="text-[10.5px] leading-none">{meta.icon}</span>
      {short ? meta.short : meta.text}
    </span>
  )
}

/** `**bold**` out of a reason string, for attributes that take no markup. */
export function plain(markdown: string) {
  return markdown.replace(/\*\*/g, '')
}

export function PlatformBadge({
  count,
  reason,
}: {
  count: number
  reason?: string
}) {
  return (
    <span className="bdg bdg-multi" title={reason ? plain(reason) : undefined}>
      <span className="text-[10.5px] leading-none">◈</span>
      Activated in {count} platform{count === 1 ? '' : 's'}
    </span>
  )
}

export function TextBadge({ children }: { children: ReactNode }) {
  return <span className="bdg bdg-dest">{children}</span>
}
