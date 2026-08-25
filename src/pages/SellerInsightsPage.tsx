import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  usePlatforms,
  useSellerSegments,
  useSellerSummary,
} from '@/api/queries'
import type { SellerLabelFilter, SellerSegment, SellerSortKey } from '@/api/types'
import { LabelSummaryTiles } from '@/components/seller/LabelSummaryTiles'
import { SellerSegmentsTable } from '@/components/seller/SellerSegmentsTable'
import { ChannelCards } from '@/components/seller/ChannelCards'
import { PlatformGrid } from '@/components/seller/PlatformGrid'
import { PlatformDrill } from '@/components/seller/PlatformDrill'
import { SegmentLabelDrawer } from '@/components/seller/SegmentLabelDrawer'
import { SELLER_FILTER_OPTIONS, SELLER_LABEL_META } from '@/lib/sellerLabels'
import { cn } from '@/lib/cn'

type Tab = 'overview' | 'performance'
type PlatformSort = 'revenue' | 'segments' | 'growth'

export function SellerInsightsPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'performance' ? 'performance' : 'overview'
  const setTab = (t: Tab) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', t)
      return next
    })

  const [search, setSearch] = useState('')
  const [label, setLabel] = useState<SellerLabelFilter | ''>('')
  const [sort, setSort] = useState<SellerSortKey>('revenue_rank')
  const [openSegmentId, setOpenSegmentId] = useState<string | null>(null)

  const query = useMemo(
    () => ({ search: search || undefined, label: label || undefined, sort }),
    [search, label, sort],
  )
  const { data: segments, isLoading } = useSellerSegments(query)
  const { data: summary } = useSellerSummary()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-[30px] pt-[26px]">
      <div className="flex items-start">
        <div>
          <h1 className="m-0 text-[34px] font-bold leading-tight tracking-[-0.6px]">
            Data Seller Insights
          </h1>
          <p className="my-[9px] text-[14.5px] text-muted">
            View your Marketplace segment metrics and performance to improve your
            strategy
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-6 border-b border-line" role="tablist">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={tab === 'performance'} onClick={() => setTab('performance')}>
          Performance
        </TabButton>
      </div>

      {tab === 'overview' ? (
        <section className="mb-6 mt-[18px] rounded-md border border-line bg-sand px-[22px] pb-6 pt-5">
          <h2 className="mb-3.5 mt-0 text-[20px] font-bold">Segments Snapshot</h2>
          <p className="mb-3 mt-0 text-[12px] text-muted2">
            Labels below are earned from delivered Marketplace usage over the last 90
            days and recomputed weekly. The four demand labels are the same ones buyers
            see on your listings. The two attention labels are private to you.
          </p>

          <LabelSummaryTiles
            tiles={summary?.tiles}
            active={label}
            onSelect={setLabel}
          />

          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <label className="field w-[300px]">
              <span className="text-muted2">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Segment Name"
                className="w-full border-0 bg-transparent text-[13.5px] outline-none"
              />
            </label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value as SellerLabelFilter | '')}
              className="field cursor-pointer text-[13.5px] text-[#3C4043]"
            >
              {SELLER_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SellerSortKey)}
              className="field cursor-pointer text-[13.5px] text-[#3C4043]"
            >
              <option value="revenue_rank">Sort: Revenue rank</option>
              <option value="revenue">Sort: Revenue</option>
              <option value="buyers_with_revenue">Sort: Buyers with revenue</option>
            </select>
            <button
              onClick={() => downloadCsv(segments?.items ?? [])}
              className="ml-auto h-[38px] rounded-[5px] bg-green px-[18px] text-[13.5px] font-bold text-[#04331E] hover:opacity-90"
            >
              Download CSV
            </button>
          </div>

          <SellerSegmentsTable
            rows={segments?.items ?? []}
            isLoading={isLoading}
            onOpen={setOpenSegmentId}
          />
        </section>
      ) : (
        <PerformanceSection onOpenSegment={setOpenSegmentId} />
      )}

      <SegmentLabelDrawer
        segmentId={openSegmentId}
        onClose={() => setOpenSegmentId(null)}
      />
    </div>
  )
}

function PerformanceSection({
  onOpenSegment,
}: {
  onOpenSegment: (id: string) => void
}) {
  const { data: platforms, isLoading } = usePlatforms()
  const { data: summary } = useSellerSummary()
  const [openId, setOpenId] = useState<string | null>(null)
  const [sort, setSort] = useState<PlatformSort>('revenue')

  const sorted = useMemo(() => {
    const list = [...(platforms ?? [])]
    return list.sort((a, b) => {
      switch (sort) {
        case 'segments':
          return b.activeSegments - a.activeSegments
        case 'growth':
          return a.growth.localeCompare(b.growth)
        case 'revenue':
        default:
          return b.revenueLastMonth - a.revenueLastMonth
      }
    })
  }, [platforms, sort])

  const openPlatform = sorted.find((p) => p.id === openId) ?? null

  return (
    <section className="mb-6 mt-[18px] rounded-md border border-line bg-sand px-[22px] pb-6 pt-5">
      <div className="mb-3 mt-1 text-[17px] font-bold">
        Channel Performance over Last Reported Month
      </div>
      {summary ? (
        <ChannelCards channels={summary.channels} />
      ) : (
        <p className="mb-6 text-[13px] text-muted2">Loading channels…</p>
      )}

      <div className="mb-3 mt-1 text-[17px] font-bold">Performance by Platform</div>
      <div className="mb-3.5 flex flex-wrap items-center gap-3">
        <FilterGroup label="Categories" tokens={['Custom', 'Health & Wellness']} more={451} />
        <FilterGroup label="Destinations" tokens={['Amazon', 'Facebook']} more={6} />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as PlatformSort)}
          className="field ml-auto cursor-pointer text-[13.5px] text-[#3C4043]"
        >
          <option value="revenue">Sort: Revenue</option>
          <option value="segments">Sort: Active segments</option>
          <option value="growth">Sort: Growth</option>
        </select>
      </div>

      {isLoading && !platforms ? (
        <p className="text-[13px] text-muted2">Loading platforms…</p>
      ) : (
        <PlatformGrid
          platforms={sorted}
          openId={openId}
          onToggle={(id) => setOpenId((cur) => (cur === id ? null : id))}
        />
      )}

      {openPlatform && (
        <PlatformDrill
          platform={openPlatform}
          onClose={() => setOpenId(null)}
          onOpenSegment={onOpenSegment}
        />
      )}
    </section>
  )
}

/**
 * The category and destination pickers are wired to the segment catalogue in
 * the buyer-side filter bar; here they show the current scope only.
 */
function FilterGroup({
  label,
  tokens,
  more,
}: {
  label: string
  tokens: string[]
  more: number
}) {
  return (
    <div className="flex min-h-[38px] flex-wrap items-center gap-[7px] rounded-[5px] border border-[#C9CDD3] bg-white px-2.5 py-[5px]">
      <span className="text-[11px] text-muted2">{label}</span>
      {tokens.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1.5 rounded-[13px] bg-[#EEF0F2] px-2.5 py-0.5 text-[12px]"
        >
          {t}
          <span className="text-[10px] text-muted2">✕</span>
        </span>
      ))}
      <span className="inline-flex items-center rounded-[13px] bg-[#EEF0F2] px-2.5 py-0.5 text-[12px]">
        +{more} more
      </span>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'border-b-[3px] pb-2.5 text-[15px]',
        active
          ? 'border-green-deep font-bold text-ink'
          : 'border-transparent font-semibold text-muted hover:text-ink2',
      )}
    >
      {children}
    </button>
  )
}

const CSV_COLUMNS = [
  'Segment Name',
  'DMS Segment ID',
  'Segment Type',
  'Revenue Rank',
  'Revenue (90d)',
  'Buyers Who Requested',
  'Buyers Distributing',
  'Buyers With Revenue',
  'Performance Labels',
]

function downloadCsv(rows: SellerSegment[]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const body = rows.map((s) =>
    [
      s.fullPath,
      s.id,
      s.segmentType,
      s.revenueRank,
      s.revenue90d,
      s.buyersRequested,
      s.buyersDistributing,
      s.buyersWithRevenue,
      s.labels.map((l) => SELLER_LABEL_META[l].text).join('; '),
    ]
      .map(escape)
      .join(','),
  )
  const csv = [CSV_COLUMNS.map(escape).join(','), ...body].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'data-seller-insights.csv'
  a.click()
  URL.revokeObjectURL(url)
}
