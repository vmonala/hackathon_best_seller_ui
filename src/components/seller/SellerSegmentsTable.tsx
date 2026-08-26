import type { SellerLabel, SellerSegment } from '@/api/types'
import { GhostBadge, SegmentPath, SellerBadge } from './SellerBadge'
import { formatUsd } from '@/lib/sellerLabels'
import { formatNumber } from '@/lib/labels'

interface Props {
  rows: SellerSegment[]
  isLoading: boolean
  onOpen: (id: string) => void
}

export function SellerSegmentsTable({ rows, isLoading, onOpen }: Props) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr>
            <Th className="w-[52%]">Segment Name</Th>
            <Th>DMS Segment ID</Th>
            <Th>Segment Type</Th>
            <Th num>
              Revenue
              <br />
              Rank
            </Th>
            <Th num>Revenue</Th>
            <Th num>
              Buyers Who
              <br />
              Requested
            </Th>
            <Th num>
              Buyers
              <br />
              Distributing
            </Th>
            <Th num>
              Buyers w/
              <br />
              Revenue
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr
              key={s.id}
              onClick={() => onOpen(s.id)}
              className="cursor-pointer hover:bg-[#F4FBF7]"
            >
              <Td>
                {/* Sized to match the buyer table's name cell. */}
                <div className="text-[13.5px] leading-[1.35]" title={s.fullPath}>
                  <SegmentPath pathPrefix={s.pathPrefix} name={s.name} />
                </div>
                <RowLabels labels={s.labels} />
              </Td>
              <Td>{s.id}</Td>
              <Td>{s.segmentType}</Td>
              <Td num>{s.revenueRank}</Td>
              <Td num>{formatUsd(s.revenue90d)}</Td>
              <Td num>{formatNumber(s.buyersRequested)}</Td>
              <Td num>{formatNumber(s.buyersDistributing)}</Td>
              <Td num>{formatNumber(s.buyersWithRevenue)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="px-6 py-[26px] text-center text-[13.5px] text-muted2">
          {isLoading ? 'Loading segments…' : 'No segments match those filters.'}
        </div>
      )}
    </div>
  )
}

/**
 * The labels under a segment name, capped at three.
 *
 * Same treatment as the buyer table: a column of its own made every row as tall
 * as its longest label list, so the labels sit under the name and everything
 * past the cap rolls into a count. `labels` is already in priority order, so the
 * cap keeps the strongest; the drawer lists them all with their criteria.
 */
const MAX_ROW_BADGES = 3

function RowLabels({ labels }: { labels: SellerLabel[] }) {
  const shown = labels.slice(0, MAX_ROW_BADGES)
  const hidden = labels.length - shown.length

  return (
    <div className="mt-[5px] flex flex-wrap items-center gap-x-0.5">
      {shown.length ? (
        shown.map((l) => <SellerBadge key={l} label={l} />)
      ) : (
        <GhostBadge>Not enough usage yet</GhostBadge>
      )}
      {hidden > 0 && (
        <span className="text-[11px] font-semibold text-muted2">+{hidden}</span>
      )}
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
      className={`border-b border-line2 px-2.5 py-[11px] align-top text-[13px] ${
        num ? 'text-right tabular-nums' : ''
      }`}
    >
      {children}
    </td>
  )
}
