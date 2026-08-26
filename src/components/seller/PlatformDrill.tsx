import { useState } from 'react'
import type { PlatformPerformance, SellerLabelFilter } from '@/api/types'
import { usePlatformSegments } from '@/api/queries'
import { GhostBadge, PlatformMark, SegmentPath, SellerBadge, StatusPill } from './SellerBadge'
import {
  DRILL_FILTER_KEYS,
  filterLabel,
  formatGrowth,
  formatImpressions,
  formatUsd,
  growthClass,
  matchesLabelFilter,
} from '@/lib/sellerLabels'
import { matchesCategories } from '@/lib/sellerFilters'
import { cn } from '@/lib/cn'

interface Props {
  platform: PlatformPerformance
  /** Category filter owned by the Performance section; empty means all. */
  categories: string[]
  onClose: () => void
  onOpenSegment: (id: string) => void
}

export function PlatformDrill({
  platform,
  categories,
  onClose,
  onOpenSegment,
}: Props) {
  const { data, isLoading } = usePlatformSegments(platform.id)
  const [chips, setChips] = useState<Set<SellerLabelFilter>>(new Set())

  const toggleChip = (key: SellerLabelFilter) =>
    setChips((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  // Categories narrow the set first, then the label chips (OR-ed within).
  const all = (data ?? []).filter((r) => matchesCategories(r.fullPath, categories))
  const rows = chips.size
    ? all.filter((r) => [...chips].some((c) => matchesLabelFilter(r.labels, c)))
    : all

  return (
    <div className="my-4 mb-5 rounded-md border border-line bg-white px-5 pb-5 pt-[18px]">
      <div className="mb-1.5 flex items-center gap-2.5">
        <PlatformMark glyph={platform.glyph} color={platform.color} size={24} />
        <b className="text-[19px]">{platform.name}</b>
        <StatusPill status={platform.status} />
        <button
          onClick={onClose}
          className="rounded-[5px] border border-line px-3 py-[5px] text-[12px] text-muted hover:bg-sand"
        >
          Close
        </button>
      </div>
      <p className="m-0 text-[12px] text-muted2">
        Your segments on {platform.name}, with the labels each one has earned on this
        destination. Labels are destination-specific — a segment can be a best seller
        here and dormant elsewhere.
        {categories.length > 0 &&
          ` Showing ${categories.join(', ')} segments only.`}
      </p>

      <div className="my-3 mb-3.5 flex flex-wrap gap-[7px]">
        {DRILL_FILTER_KEYS.map((key) => {
          const on = chips.has(key)
          const warn = key === 'needs_attention'
          return (
            <button
              key={key}
              aria-pressed={on}
              onClick={() => toggleChip(key)}
              className={cn(
                'rounded-[15px] border-[1.3px] px-3 py-[5px] text-[12.5px]',
                on
                  ? warn
                    ? 'border-[#B3261E] bg-[#B3261E] font-semibold text-white'
                    : 'border-ink bg-ink font-semibold text-white'
                  : 'border-line bg-white text-[#3C4043] hover:border-[#B9BDC4]',
              )}
            >
              {filterLabel(key)}
            </button>
          )
        })}
        {chips.size > 0 && (
          <button
            onClick={() => setChips(new Set())}
            className="rounded-[15px] border-[1.3px] border-line bg-white px-3 py-[5px] text-[12.5px] text-[#3C4043]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-line">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr>
              <Th className="w-[30%]">Segment Name</Th>
              <Th>Segment ID</Th>
              <Th num>
                Prior Month
                <br />
                Revenue
              </Th>
              <Th num>
                Growth From
                <br />
                Prior Month
              </Th>
              <Th num>Impressions</Th>
              <Th className="w-[19%]">Labels</Th>
              <Th className="w-[18%]">Destinations</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.segmentId}
                onClick={() => onOpenSegment(r.segmentId)}
                className="cursor-pointer hover:bg-[#F4FBF7]"
              >
                <Td>
                  <SegmentPath pathPrefix={r.pathPrefix} name={r.name} />
                </Td>
                <Td>{r.segmentId}</Td>
                <Td num>{formatUsd(r.revenuePriorMonth)}</Td>
                <Td num>
                  <span className={growthClass(r.growthPct)}>
                    {formatGrowth(r.growthPct)}
                  </span>
                </Td>
                <Td num>{formatImpressions(r.impressions)}</Td>
                <Td>
                  {r.labels.length ? (
                    r.labels.map((l) => <SellerBadge key={l} label={l} />)
                  ) : (
                    <GhostBadge>None yet</GhostBadge>
                  )}
                </Td>
                <Td>
                  <span className="text-[12px] text-muted">{r.destinations}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="px-6 py-[26px] text-center text-[13.5px] text-muted2">
            {isLoading
              ? 'Loading segments…'
              : categories.length
                ? 'No segments match the selected categories on this destination.'
                : 'No segments with those labels on this destination.'}
          </div>
        )}
      </div>
    </div>
  )
}

function Th({
  children,
  num,
  className,
}: {
  children: React.ReactNode
  num?: boolean
  className?: string
}) {
  return (
    <th
      className={`border-b-[1.5px] border-[#C9CDD3] bg-white px-2.5 py-[11px] text-[12px] font-bold leading-[1.25] text-[#202124] ${
        num ? 'text-right' : 'text-left'
      } ${className ?? ''}`}
    >
      {children}
    </th>
  )
}

function Td({ children, num }: { children: React.ReactNode; num?: boolean }) {
  return (
    <td
      className={`border-b border-line2 px-2.5 py-[11px] align-middle text-[13px] ${
        num ? 'text-right tabular-nums' : ''
      }`}
    >
      {children}
    </td>
  )
}
