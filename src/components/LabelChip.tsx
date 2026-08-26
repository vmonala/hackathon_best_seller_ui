import * as Tooltip from '@radix-ui/react-tooltip'
import type { EarnedLabelExplanation, Segment, SegmentLabel } from '@/api/types'
import { LABEL_META } from '@/lib/labels'
import { renderBold } from '@/lib/markdown'
import { LabelBadge, plain } from './Badge'
import { cn } from '@/lib/cn'

/**
 * A label with the reason it was awarded on hover.
 *
 * The reason is the whole point of the chip — "Best seller" only means
 * something once you know it is "10 buyers have this enabled, and the
 * catalogue's top 10% starts at 10" — so it is carried both in the tooltip and
 * in a native `title`, which keeps it reachable on touch and matches how every
 * other badge in the app behaves.
 */

interface LabelChipProps {
  label: SegmentLabel
  /** The segment's own reason. Falls back to the label's wording. */
  reason?: string
  /** `PlatformBadge` names the segment's platform count; pass it through. */
  count?: number
}

export function LabelChip({ label, reason, count }: LabelChipProps) {
  const meta = LABEL_META[label]
  const text =
    label === 'active_platforms' && count != null
      ? `Activated in ${count} platform${count === 1 ? '' : 's'}`
      : meta.text

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span
          className={cn('bdg', meta.className)}
          title={plain(reason ?? meta.text)}
        >
          <span className="text-[10.5px] leading-none">{meta.icon}</span>
          {text}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          collisionPadding={8}
          className="z-50 max-w-[260px] rounded-lg border border-line bg-white px-2.5 py-2 text-[12px] leading-[1.45] text-ink shadow-pop"
        >
          <span className="block font-bold">
            {meta.icon} {text}
          </span>
          <span className="block text-muted2">{plain(reason ?? meta.text)}</span>
          <Tooltip.Arrow className="fill-white" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

/** Every label a segment carries, uncapped. Renders nothing when it has none. */
export function LabelChips({ segment }: { segment: Segment }) {
  if (!segment.labels.length) return null
  return (
    <>
      {segment.labels.map((l) => (
        <LabelChip
          key={l}
          label={l}
          reason={segment.labelReasons[l]}
          count={l === 'active_platforms' ? segment.platformCount : undefined}
        />
      ))}
    </>
  )
}

/**
 * "How it earned its labels" — every label in the vocabulary, whether this
 * segment earned it, and why.
 *
 * The misses are shown too, greyed: "not a best seller, 6 buyers against a
 * cut-off of 10" places the segment for a buyer in a way that omitting the row
 * cannot.
 */
export function LabelExplanations({
  earned,
  platformCount,
}: {
  earned: EarnedLabelExplanation[]
  /** Names the segment's own platform count on the `active_platforms` row. */
  platformCount?: number
}) {
  if (!earned.length) {
    return (
      <p className="py-2 text-[12px] leading-[1.5] text-muted2">
        No labels yet. Labels are awarded from catalogue-wide cut-offs on reach,
        buyers, delivered impressions and platform breadth.
      </p>
    )
  }

  return (
    <>
      {earned.map((e) => (
        <div
          key={e.label}
          className="flex items-start gap-2.5 border-b border-line2 py-2 last:border-b-0"
        >
          {e.earned ? (
            <LabelChip
              label={e.label}
              reason={e.explanation}
              count={e.label === 'active_platforms' ? platformCount : undefined}
            />
          ) : (
            <LabelBadge label={e.label} short muted />
          )}
          <div
            className={cn(
              'text-[12px] leading-[1.5]',
              e.earned ? 'text-muted' : 'text-muted2',
            )}
          >
            {renderBold(e.explanation)}
          </div>
        </div>
      ))}
    </>
  )
}
