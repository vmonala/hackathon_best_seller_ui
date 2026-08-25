import type { ReactNode } from 'react'
import type { PerformanceLabel } from '@/api/types'
import { LABEL_META } from '@/lib/labels'
import { cn } from '@/lib/cn'

interface LabelBadgeProps {
  label: PerformanceLabel
  short?: boolean
  muted?: boolean
  className?: string
}

export function LabelBadge({ label, short, muted, className }: LabelBadgeProps) {
  const meta = LABEL_META[label]
  return (
    <span
      className={cn('bdg', meta.className, muted && 'opacity-40', className)}
      title={meta.text}
    >
      <span className="text-[10.5px] leading-none">{meta.icon}</span>
      {short ? meta.short : meta.text}
    </span>
  )
}

export function PlatformBadge({ count }: { count: number }) {
  return (
    <span className="bdg bdg-multi">
      <span className="text-[10.5px] leading-none">◈</span>
      {count} platforms
    </span>
  )
}

export function TextBadge({ children }: { children: ReactNode }) {
  return <span className="bdg bdg-dest">{children}</span>
}

