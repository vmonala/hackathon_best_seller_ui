import * as Tooltip from '@radix-ui/react-tooltip'
import type { SegmentTag } from '@/api/types'
import { tagIcon } from '@/lib/labels'
import { cn } from '@/lib/cn'

/**
 * A tag awarded by the Segment Intelligence API, with the reason it was awarded
 * on hover.
 *
 * The description is the whole point of the chip — "Top Facebook Activated" only
 * means something once you know it is "Top 10% distributed on Facebook" — so it
 * is carried both in the tooltip and in a native `title`, which keeps it
 * reachable on touch and matches how every other badge in the app behaves.
 */

/** Category tones. Anything unrecognised falls back to the neutral badge. */
const CATEGORY_TONE: Record<string, string> = {
  platform: 'bdg-tag-platform',
  reach: 'bdg-tag-reach',
  distribution: 'bdg-tag-distribution',
}

export function TagChip({ tag }: { tag: SegmentTag }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span
          className={cn('bdg bdg-tag', CATEGORY_TONE[tag.category] ?? 'bdg-neutral')}
          title={tag.description}
        >
          <span className="text-[10.5px] leading-none">{tagIcon(tag)}</span>
          {tag.name}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          collisionPadding={8}
          className="z-50 max-w-[240px] rounded-lg border border-line bg-white px-2.5 py-2 text-[12px] leading-[1.45] text-ink shadow-pop"
        >
          <span className="block font-bold">
            {tagIcon(tag)} {tag.name}
          </span>
          <span className="block text-muted2">{tag.description}</span>
          <Tooltip.Arrow className="fill-white" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

/** The chips for a segment, uncapped. Renders nothing when there are no tags. */
export function TagChips({ tags }: { tags: SegmentTag[] | undefined }) {
  if (!tags?.length) return null
  return (
    <>
      {tags.map((t) => (
        <TagChip key={t.key} tag={t} />
      ))}
    </>
  )
}

/**
 * "How it earned its tags" — every tag the segment carries, each with the
 * reason the Segment Intelligence API awarded it.
 *
 * This replaces the earned-labels breakdown that used to sit here. Labels are
 * a five-value vocabulary shown as badges at the top of the sheet; the tags are
 * what actually explain themselves, and their descriptions are the explanation.
 */
export function TagExplanations({ tags }: { tags: SegmentTag[] | undefined }) {
  if (!tags?.length) {
    return (
      <p className="py-2 text-[12px] leading-[1.5] text-muted2">
        No tags yet. Tags are awarded from catalogue-wide cut-offs on
        distribution, reach and platform breadth.
      </p>
    )
  }

  return (
    <>
      {tags.map((t) => (
        <div
          key={t.key}
          className="flex items-start gap-2.5 border-b border-line2 py-2 last:border-b-0"
        >
          <TagChip tag={t} />
          <div className="text-[12px] leading-[1.5] text-muted">{t.description}</div>
        </div>
      ))}
    </>
  )
}

