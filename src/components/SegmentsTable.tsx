import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import type { Segment, SortKey } from '@/api/types'
import { Checkbox } from './Checkbox'
import { LabelBadge, PlatformBadge } from './Badge'
import { DestinationDots } from './DestinationDots'
import { formatDate, formatReach } from '@/lib/labels'
import {
  ESTIMATED_CATALOG_METRICS,
  METRIC_LABELS,
  SHOW_CATALOG_METRICS,
  SHOW_DATE_ADDED,
} from '@/lib/metricLabels'
import { cn } from '@/lib/cn'

/**
 * One scrollable metric column.
 *
 * Segment Name is not in this list: it is pinned to the left edge with the
 * select box, so it stays readable while the metrics scroll underneath the
 * horizontal scrollbar. Everything here is fixed-width so the pinned columns
 * can be positioned with `sticky` offsets that do not shift as rows load.
 */
interface MetricColumn {
  id: string
  header: string
  width: number
  /**
   * Whether the current API mode reports this field at all. A column without
   * data stays in the picker — so nothing is silently missing — but starts
   * hidden rather than filling the table with dashes.
   */
  hasData: boolean
  /** Checked by default in the picker. */
  defaultVisible: boolean
  /**
   * Catalogue attribute rather than delivered usage. In live mode these carry a
   * derived stand-in, so they are tagged as estimates wherever they appear.
   */
  catalogAttribute?: boolean
  sortKey?: SortKey
  cell: (s: Segment) => React.ReactNode
}

const dash = <span className="text-muted2">-</span>

const usd = (n?: number) => (n == null ? dash : `$${n.toFixed(2)}`)
const pct = (n?: number) => (n == null ? dash : `${n}%`)
const reach = (n?: number) => (n == null ? dash : formatReach(n))

const METRIC_COLUMNS: MetricColumn[] = [
  {
    id: 'cpm',
    header: 'CPM',
    width: 92,
    hasData: SHOW_CATALOG_METRICS,
    defaultVisible: SHOW_CATALOG_METRICS,
    catalogAttribute: true,
    cell: (s) => usd(s.cpm),
  },
  {
    id: 'programmaticPctOfMedia',
    header: 'Programmatic % of Media',
    width: 132,
    hasData: SHOW_CATALOG_METRICS,
    defaultVisible: SHOW_CATALOG_METRICS,
    catalogAttribute: true,
    cell: (s) => pct(s.programmaticPctOfMedia),
  },
  {
    id: 'cpmCap',
    header: 'CPM Cap',
    width: 100,
    hasData: SHOW_CATALOG_METRICS,
    defaultVisible: SHOW_CATALOG_METRICS,
    catalogAttribute: true,
    cell: (s) => usd(s.cpmCap),
  },
  {
    id: 'pctMedia',
    header: METRIC_LABELS.pctMedia,
    width: 168,
    hasData: true,
    defaultVisible: true,
    cell: (s) => pct(s.advertiserDirectPctOfMedia),
  },
  {
    id: 'cpc',
    header: METRIC_LABELS.cpc,
    width: 92,
    hasData: true,
    defaultVisible: true,
    sortKey: 'cpc',
    cell: (s) => usd(s.cpc),
  },
  {
    id: 'cookieReach',
    header: METRIC_LABELS.reach,
    width: 104,
    hasData: true,
    defaultVisible: true,
    sortKey: 'cookie_reach',
    cell: (s) => reach(s.cookieReach),
  },
  {
    id: 'iosReach',
    header: 'iOS Reach',
    width: 100,
    hasData: SHOW_CATALOG_METRICS,
    defaultVisible: SHOW_CATALOG_METRICS,
    catalogAttribute: true,
    cell: (s) => reach(s.iosReach),
  },
  {
    id: 'androidReach',
    header: 'Android Reach',
    width: 112,
    hasData: SHOW_CATALOG_METRICS,
    defaultVisible: SHOW_CATALOG_METRICS,
    catalogAttribute: true,
    cell: (s) => reach(s.androidReach),
  },
  {
    id: 'inputRecords',
    header: 'Input Records',
    width: 110,
    hasData: SHOW_CATALOG_METRICS,
    defaultVisible: SHOW_CATALOG_METRICS,
    catalogAttribute: true,
    cell: (s) => reach(s.inputRecords),
  },
  {
    id: 'dateAdded',
    header: 'Date Added',
    width: 118,
    hasData: SHOW_DATE_ADDED,
    defaultVisible: SHOW_DATE_ADDED,
    catalogAttribute: true,
    sortKey: 'date_added',
    cell: (s) => formatDate(s.dateAdded),
  },
  // Off by default: the mockup's column set is the rate card and the reach
  // figures, and the performance labels are shown as badges under each segment
  // name.
  {
    id: 'destinations',
    header: 'Active Destinations',
    width: 150,
    hasData: true,
    defaultVisible: false,
    cell: (s) => <DestinationDots destinations={s.destinations} />,
  },
]

/**
 * Every column is offered in the picker. The live usage feed carries no rate
 * card, no device-level reach, no input record count and no created date, so
 * those columns render "-" there; they are listed as "no data" and start
 * hidden instead of being dropped, which otherwise reads as a missing feature.
 */
const AVAILABLE_COLUMNS = METRIC_COLUMNS

const SELECT_WIDTH = 34
/** Pinned name column: full width, and the narrower one used beside a panel. */
const NAME_WIDTH = 330
const NAME_WIDTH_COMPACT = 232
const ACTIONS_WIDTH = 44

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
  /** Row click — opens the segment detail panel. */
  onOpenSegment?: (id: string) => void
  /** The segment whose panel is open, highlighted in the table. */
  activeSegmentId?: string | null
  /** "View full details" in the row menu. */
  onViewFullDetails?: (id: string) => void
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
  onOpenSegment,
  activeSegmentId,
  onViewFullDetails,
}: SegmentsTableProps) {
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(AVAILABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [menuRow, setMenuRow] = useState<string | null>(null)

  const columns = useMemo(
    () => AVAILABLE_COLUMNS.filter((c) => visible.has(c.id)),
    [visible],
  )

  // Named in the footnote so it is clear which numbers on screen are derived.
  const estimatedShown = ESTIMATED_CATALOG_METRICS
    ? columns.filter((c) => c.catalogAttribute).map((c) => c.header)
    : []

  const nameWidth = compact ? NAME_WIDTH_COMPACT : NAME_WIDTH
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someChecked = rows.some((r) => selected.has(r.id))

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
    <div className="relative mt-2.5">
      {/* The gear floats above the scroller so it stays reachable at any
          horizontal scroll position, like the mockup. */}
      <ColumnPicker visible={visible} onChange={setVisible} />

      <div className="overflow-x-auto">
        {/* border-separate, not border-collapse: a collapsed table drops the
            borders of `position: sticky` cells, which is how the pinned Segment
            Name column is held against the left edge. */}
        <table
          className="w-full table-fixed border-separate border-spacing-0"
          style={{
            minWidth:
              SELECT_WIDTH +
              nameWidth +
              columns.reduce((sum, c) => sum + c.width, 0) +
              ACTIONS_WIDTH,
          }}
        >
          <colgroup>
            <col style={{ width: SELECT_WIDTH }} />
            <col style={{ width: nameWidth }} />
            {columns.map((c) => (
              <col key={c.id} style={{ width: c.width }} />
            ))}
            <col style={{ width: ACTIONS_WIDTH }} />
            {/* Auto-width filler. Under `table-fixed` the leftover space goes to
                the columns without a width, so on a wide screen — or in live
                mode, where the rate-card columns have no data to show — the
                table still spans the page without stretching Segment Name. */}
            <col />
          </colgroup>
          <thead>
            <tr>
              <Th pinned left={0}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={onToggleAll}
                  label="Select all segments"
                />
              </Th>
              <Th
                pinned
                left={SELECT_WIDTH}
                divider
                compact={compact}
                sortKey="name"
                sort={sort}
                direction={direction}
                onSort={onSort}
              >
                Segment Name
              </Th>
              {columns.map((c) => (
                <Th
                  key={c.id}
                  compact={compact}
                  sortKey={c.sortKey}
                  sort={sort}
                  direction={direction}
                  onSort={onSort}
                >
                  {c.header}
                </Th>
              ))}
              {/* Sits under the floating gear. */}
              <Th />
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const isActive = s.id === activeSegmentId
              return (
                <tr
                  key={s.id}
                  onClick={() => onOpenSegment?.(s.id)}
                  className={cn(
                    'group cursor-pointer transition-colors',
                    isActive
                      ? 'bg-green-mint/60 shadow-[inset_0_1.5px_0_#00A05A,inset_0_-1.5px_0_#00A05A]'
                      : 'hover:bg-[#FAFBFC]',
                  )}
                >
                  <Td pinned left={0} active={isActive}>
                    <Checkbox
                      checked={selected.has(s.id)}
                      onChange={() => onToggleRow(s.id)}
                      label={`Select ${s.name}`}
                    />
                  </Td>
                  <Td pinned left={SELECT_WIDTH} divider active={isActive}>
                    <div
                      className={cn(
                        'flex items-baseline gap-1 overflow-hidden leading-[1.35] text-ink',
                        compact ? 'text-[12.5px]' : 'text-[13.5px]',
                      )}
                      title={s.fullPath}
                    >
                      <span className="min-w-0 shrink truncate text-[#6B7280]">
                        {compact ? compactPrefix(s.pathPrefix) : s.pathPrefix}
                      </span>
                      <span className="min-w-0 max-w-full shrink-0 truncate">
                        {s.name}
                      </span>
                    </div>
                    <RowLabels segment={s} />
                  </Td>
                  {columns.map((c) => (
                    <Td key={c.id} compact={compact} active={isActive}>
                      {c.cell(s)}
                    </Td>
                  ))}
                  <Td active={isActive}>
                    <RowMenu
                      open={menuRow === s.id}
                      onOpenChange={(o) => setMenuRow(o ? s.id : null)}
                      visible={isActive || menuRow === s.id}
                      onViewFullDetails={
                        onViewFullDetails && (() => onViewFullDetails(s.id))
                      }
                      segmentId={s.id}
                    />
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {estimatedShown.length > 0 && (
        <p className="mt-2 text-[11.5px] leading-[1.5] text-muted2">
          {estimatedShown.join(', ')}{' '}
          {estimatedShown.length === 1 ? 'is an estimate' : 'are estimates'} derived
          from delivered usage — the catalog API does not report{' '}
          {estimatedShown.length === 1 ? 'it' : 'them'}.
        </p>
      )}
    </div>
  )
}

/**
 * Performance labels under a segment name.
 *
 * Badges are drawn short and capped at two: full-length badges wrap onto a line
 * each in the pinned column and multiply the height of every row. Anything over
 * the cap is counted, and the detail panel lists them all.
 */
const MAX_ROW_BADGES = 2

function RowLabels({ segment }: { segment: Segment }) {
  if (segment.labels.length === 0) return null

  const named = segment.labels.filter((l) => l !== 'proven_multi_platform')
  const multi = segment.labels.length !== named.length
  const shown = named.slice(0, multi ? MAX_ROW_BADGES - 1 : MAX_ROW_BADGES)
  const hidden = named.length - shown.length

  return (
    <div className="mt-[7px] flex flex-wrap items-center gap-1.5">
      {shown.map((l) => (
        <LabelBadge key={l} label={l} short />
      ))}
      {multi && <PlatformBadge count={segment.platformCount} />}
      {hidden > 0 && (
        <span className="text-[11px] font-semibold text-muted2">+{hidden}</span>
      )}
    </div>
  )
}

/**
 * Header cell. `pinned` freezes the cell against the left edge of the scroller
 * at `left`; `divider` draws the seam between the pinned block and the metrics.
 */
function Th({
  children,
  pinned,
  left,
  divider,
  compact,
  sortKey,
  sort,
  direction,
  onSort,
}: {
  children?: React.ReactNode
  pinned?: boolean
  left?: number
  divider?: boolean
  compact?: boolean
  sortKey?: SortKey
  sort?: SortKey
  direction?: 'asc' | 'desc'
  onSort?: (key: SortKey) => void
}) {
  const sortable = Boolean(sortKey && onSort)
  return (
    <th
      style={pinned ? { left } : undefined}
      className={cn(
        'border-b-[1.5px] border-[#C9CDD3] bg-white px-2.5 py-3 text-left align-bottom text-[12.5px] font-bold leading-[1.25] text-[#202124]',
        compact && 'text-[11.5px]',
        pinned && 'sticky z-20',
        divider && 'border-r border-r-line',
        sortable && 'cursor-pointer select-none hover:text-indigo-ink',
      )}
      onClick={sortable ? () => onSort!(sortKey!) : undefined}
    >
      {children}
      {sortable && sort === sortKey && (
        <span className="ml-1 text-[9px] text-indigo">
          {direction === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </th>
  )
}

function Td({
  children,
  pinned,
  left,
  divider,
  compact,
  active,
}: {
  children?: React.ReactNode
  pinned?: boolean
  left?: number
  divider?: boolean
  compact?: boolean
  active?: boolean
}) {
  return (
    <td
      style={pinned ? { left } : undefined}
      className={cn(
        'border-b border-line2 px-2.5 py-3 align-top text-[13.5px] tabular-nums',
        compact && 'text-[12.5px]',
        // A pinned cell scrolls over the metrics, so it needs its own opaque
        // background — including the row states, which would otherwise show
        // through only on the scrolling half of the row.
        pinned && 'sticky z-10',
        pinned && (active ? 'bg-[#DDF6E9]' : 'bg-white group-hover:bg-[#FAFBFC]'),
        divider && 'border-r border-r-line',
      )}
    >
      {children}
    </td>
  )
}

function ColumnPicker({
  visible,
  onChange,
}: {
  visible: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const toggle = (id: string) => {
    const next = new Set(visible)
    // At least one metric column has to stay on, or the header row collapses to
    // the pinned segment name with nothing to scroll.
    if (next.has(id)) {
      if (next.size === 1) return
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange(next)
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Choose columns"
        className="absolute right-0 top-1.5 z-30 flex h-6 w-6 items-center justify-center rounded bg-white text-[15px] text-[#3C4043] hover:text-indigo-ink"
      >
        ⚙
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[260px] rounded-lg border border-line bg-white p-3 shadow-pop"
        >
          <div className="sec-label mb-2">Columns</div>
          <div className="flex flex-col gap-0.5">
            {AVAILABLE_COLUMNS.map((c) => (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className="flex items-center gap-2.5 rounded px-1.5 py-[6px] text-left text-[13px] hover:bg-line2"
              >
                <Checkbox
                  checked={visible.has(c.id)}
                  onChange={() => toggle(c.id)}
                  label={c.header}
                />
                <span className="flex-1">{c.header}</span>
                {!c.hasData ? (
                  <span className="text-[11px] text-muted2">no data</span>
                ) : c.catalogAttribute && ESTIMATED_CATALOG_METRICS ? (
                  <span className="text-[11px] text-muted2">estimated</span>
                ) : null}
              </button>
            ))}
          </div>
          <p className="mt-2 border-t border-line2 pt-2 text-[11.5px] text-muted2">
            Segment Name stays pinned to the left while these scroll.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function RowMenu({
  open,
  onOpenChange,
  visible,
  onViewFullDetails,
  segmentId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  visible: boolean
  onViewFullDetails?: () => void
  segmentId: string
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        aria-label="Segment actions"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded text-[15px] leading-none text-[#3C4043] hover:bg-line2',
          visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        …
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
          className="z-50 w-[210px] rounded-lg border border-line bg-white p-1.5 shadow-pop"
        >
          {onViewFullDetails && (
            <MenuItem
              onClick={() => {
                onOpenChange(false)
                onViewFullDetails()
              }}
            >
              View full details
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              navigator.clipboard?.writeText(segmentId)
              onOpenChange(false)
            }}
          >
            Copy segment ID
          </MenuItem>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full rounded px-2.5 py-2 text-left text-[13px] hover:bg-line2"
    >
      {children}
    </button>
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
