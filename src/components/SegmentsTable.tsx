import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import type { Segment, SortKey } from '@/api/types'
import { Checkbox } from './Checkbox'
import { LabelBadge, PlatformBadge } from './Badge'
import { ScoreBar } from './ScoreBar'
import { DestinationDots } from './DestinationDots'
import { formatDate, formatReach } from '@/lib/labels'
import { cn } from '@/lib/cn'

const col = createColumnHelper<Segment>()

interface SegmentsTableProps {
  rows: Segment[]
  selected: Set<string>
  onToggleRow: (id: string) => void
  onToggleAll: (checked: boolean) => void
  isLoading?: boolean
  compact?: boolean
  sort?: SortKey
  direction?: 'asc' | 'desc'
  onSort?: (key: SortKey) => void
}

export function SegmentsTable({
  rows,
  selected,
  onToggleRow,
  onToggleAll,
  isLoading,
  compact,
  sort,
  direction,
  onSort,
}: SegmentsTableProps) {
  const navigate = useNavigate()

  const columns = useMemo<ColumnDef<Segment, any>[]>(() => {
    const nameCol = col.accessor('name', {
      id: 'name',
      header: 'Segment Name',
      meta: { sortKey: 'name' as SortKey, width: compact ? undefined : '44%' },
      cell: (ctx) => {
        const s = ctx.row.original
        return (
          <div>
            <div
              className={cn(
                'leading-[1.35] text-ink',
                compact ? 'text-[12.5px]' : 'text-[13.5px]',
              )}
            >
              <span className="text-[#6B7280]">
                {compact ? compactPrefix(s.pathPrefix) : s.pathPrefix}
              </span>{' '}
              {s.name}
            </div>
            {s.labels.length > 0 && (
              <div className="mt-[7px] flex flex-wrap items-center gap-1.5">
                {s.labels
                  .filter((l) => l !== 'proven_multi_platform')
                  .slice(0, compact ? 2 : 2)
                  .map((l) => (
                    <LabelBadge key={l} label={l} short={compact} />
                  ))}
                {s.labels.includes('proven_multi_platform') && (
                  <PlatformBadge count={s.platformCount} />
                )}
              </div>
            )}
          </div>
        )
      },
    })

    const scoreCol = col.accessor('marketplaceScore', {
      id: 'marketplaceScore',
      header: compact ? 'Score' : 'Marketplace Score',
      meta: { sortKey: 'marketplace_score' as SortKey, width: compact ? '70px' : '11%' },
      cell: (ctx) =>
        compact ? (
          <span className="text-sm font-bold tabular-nums">{ctx.getValue()}</span>
        ) : (
          <ScoreBar score={ctx.getValue()} />
        ),
    })

    const cpcCol = col.accessor('cpc', {
      id: 'cpc',
      header: 'CPC',
      meta: { sortKey: 'cpc' as SortKey, width: compact ? '60px' : '7%' },
      cell: (ctx) => `$${ctx.getValue().toFixed(2)}`,
    })

    const selectCol = col.display({
      id: 'select',
      meta: { width: compact ? '22px' : '26px' },
      header: () => (
        <Checkbox
          checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
          indeterminate={
            rows.some((r) => selected.has(r.id)) &&
            !rows.every((r) => selected.has(r.id))
          }
          onChange={onToggleAll}
          label="Select all segments"
        />
      ),
      cell: (ctx) => (
        <Checkbox
          checked={selected.has(ctx.row.original.id)}
          onChange={() => onToggleRow(ctx.row.original.id)}
          label={`Select ${ctx.row.original.name}`}
        />
      ),
    })

    if (compact) return [selectCol, nameCol, scoreCol, cpcCol]

    return [
      selectCol,
      nameCol,
      scoreCol,
      col.display({
        id: 'destinations',
        header: 'Active Destinations',
        meta: { width: '11%' },
        cell: (ctx) => <DestinationDots destinations={ctx.row.original.destinations} />,
      }),
      col.accessor('advertiserDirectPctOfMedia', {
        id: 'pctMedia',
        header: 'Advertiser Direct % of Media',
        meta: { width: '9%' },
        cell: (ctx) => `${ctx.getValue()}%`,
      }),
      cpcCol,
      col.accessor('cookieReach', {
        id: 'cookieReach',
        header: 'Cookie Reach',
        meta: { sortKey: 'cookie_reach' as SortKey, width: '9%' },
        cell: (ctx) => formatReach(ctx.getValue()),
      }),
      col.accessor('dateAdded', {
        id: 'dateAdded',
        header: 'Date Added',
        meta: { sortKey: 'date_added' as SortKey, width: '9%' },
        cell: (ctx) => formatDate(ctx.getValue()),
      }),
    ]
  }, [compact, rows, selected, onToggleAll, onToggleRow])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  if (isLoading) return <TableSkeleton compact={compact} />

  if (rows.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-line py-14 text-center">
        <p className="text-sm font-semibold text-ink2">No segments match these filters</p>
        <p className="mt-1 text-[13px] text-muted">
          Try removing a performance label or destination.
        </p>
      </div>
    )
  }

  return (
    <table className="mt-2.5 w-full border-collapse">
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((header) => {
              const meta = header.column.columnDef.meta as
                | { sortKey?: SortKey; width?: string }
                | undefined
              const sortable = Boolean(meta?.sortKey && onSort)
              const isActive = sort === meta?.sortKey
              return (
                <th
                  key={header.id}
                  style={{ width: meta?.width }}
                  className={cn(
                    'border-b-[1.5px] border-[#C9CDD3] px-2.5 py-3 text-left align-bottom text-[12.5px] font-bold leading-[1.25] text-[#202124]',
                    compact && 'text-[11.5px]',
                    sortable && 'cursor-pointer select-none hover:text-indigo-ink',
                  )}
                  onClick={
                    sortable ? () => onSort!(meta!.sortKey as SortKey) : undefined
                  }
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {sortable && isActive && (
                    <span className="ml-1 text-[9px] text-indigo">
                      {direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            onClick={() => navigate(`/segments/${row.original.id}`)}
            className="cursor-pointer transition-colors hover:bg-[#FAFBFC]"
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={cn(
                  'border-b border-line2 px-2.5 py-3 align-top text-[13.5px]',
                  compact && 'text-[12.5px]',
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function compactPrefix(prefix: string) {
  const parts = prefix.split('>').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 2) return `${parts.join(' > ')} >`
  return `${parts[0]} > ${parts[1]} > ... >`
}

function TableSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line2 pb-3">
          <div className="h-[15px] w-[15px] animate-pulse rounded bg-line2" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/5 animate-pulse rounded bg-line2" />
            <div className="h-4 w-32 animate-pulse rounded bg-line2" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-line2" />
        </div>
      ))}
    </div>
  )
}
