import type { SellerSegment } from '@/api/types'
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
            <Th className="w-[27%]">Segment Name</Th>
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
            <Th className="w-[20%]">Performance Labels</Th>
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
                <SegmentPath pathPrefix={s.pathPrefix} name={s.name} />
              </Td>
              <Td>{s.id}</Td>
              <Td>{s.segmentType}</Td>
              <Td num>{s.revenueRank}</Td>
              <Td num>{formatUsd(s.revenue90d)}</Td>
              <Td num>{formatNumber(s.buyersRequested)}</Td>
              <Td num>{formatNumber(s.buyersDistributing)}</Td>
              <Td num>{formatNumber(s.buyersWithRevenue)}</Td>
              <Td>
                {s.labels.length ? (
                  s.labels.map((l) => <SellerBadge key={l} label={l} />)
                ) : (
                  <GhostBadge>Not enough usage yet</GhostBadge>
                )}
              </Td>
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
