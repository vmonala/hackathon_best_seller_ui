import { useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Link } from 'react-router-dom'
import { useSegment } from '@/api/queries'
import type { SegmentDetail } from '@/api/types'
import { LabelChips, LabelExplanations } from './LabelChip'
import { DestinationChip } from './DestinationDots'
import { UsageSparkline } from './UsageSparkline'
import {
  destinationMeta,
  formatDate,
  formatNumber,
  formatReach,
  USAGE_TEXT,
} from '@/lib/labels'
import { windowLabel, windowValue } from './PerformanceTab'
import { ESTIMATED_CATALOG_METRICS, METRIC_LABELS } from '@/lib/metricLabels'
import { cn } from '@/lib/cn'

interface Props {
  segmentId: string
  onClose: () => void
}

/**
 * The segment sheet that opens beside the table when a row is clicked.
 *
 * It sits in the page flow rather than over it — the same arrangement the AI
 * discovery panel uses — so the table stays usable and the reader can click
 * straight through to the next segment.
 */
export function SegmentDetailPanel({ segmentId, onClose }: Props) {
  const { data: segment, isLoading, isError, error } = useSegment(segmentId)

  return (
    <aside className="flex w-[580px] shrink-0 flex-col overflow-y-auto border-l border-line bg-white">
      <div className="sticky top-0 z-10 bg-white px-[26px] pb-0 pt-[22px]">
        <div className="flex items-start gap-4">
          <h2 className="min-w-0 flex-1 text-[21px] font-bold leading-[1.3] tracking-[-0.3px]">
            {segment?.fullPath ?? (isLoading ? 'Loading…' : 'Segment')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close segment details"
            className="mt-1 text-[17px] leading-none text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
        {/* Every label, uncapped and with its reason on hover — the sheet has
            the room the pinned table column does not. */}
        {segment && segment.labels.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pb-1">
            <LabelChips segment={segment} />
          </div>
        )}
      </div>

      {isError ? (
        <div className="mx-[26px] mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Could not load this segment: {(error as Error)?.message ?? 'Not found'}
        </div>
      ) : !segment ? (
        <div className="px-[26px] py-6">
          <div className="h-20 animate-pulse rounded-lg bg-line2" />
          <div className="mt-4 h-48 animate-pulse rounded-lg bg-line2" />
        </div>
      ) : (
        <PanelBody segment={segment} />
      )}
    </aside>
  )
}

const TABS = [
  { value: 'details', label: 'Details' },
  { value: 'permissions', label: 'Permissions' },
  { value: 'pricing', label: 'Pricing' },
]

function PanelBody({ segment: s }: { segment: SegmentDetail }) {
  return (
    <Tabs.Root defaultValue="details" className="min-h-0 flex-1">
      <Tabs.List className="mt-[18px] flex border-b border-line px-[26px]">
        {TABS.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className="flex-1 py-3 text-[13.5px] text-muted transition-colors data-[state=active]:font-bold data-[state=active]:text-ink data-[state=active]:shadow-[inset_0_-2.5px_0_#5BE49B]"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="details" className="px-[26px] pb-10 pt-[22px]">
        <SellerWordmark seller={s.seller} />

        <div className="mt-5 space-y-2.5">
          <Section title="Configuration">
            <Stacked label="Segment Name" value={s.fullPath} />
            <Stacked label="Description" value={s.description ?? '-'} />
          </Section>

          <Section title="Asset Overview">
            <Row label="Segment Type" value={s.segmentType ?? '-'} />
            <Row label="Segment ID" value={s.id} />
            <Row label="Date Added" value={formatDate(s.dateAdded)} />
            <Row
              label={METRIC_LABELS.impressions}
              value={count(s.impressions90d)}
            />
            <Row
              label="Data Seller"
              value={
                <Link
                  to={`/segments?seller=${encodeURIComponent(s.seller)}`}
                  className="text-indigo-ink hover:underline"
                >
                  {s.seller}
                </Link>
              }
            />
            <Row
              label="Input Records (Size)"
              asOf={s.inputRecordsAsOf}
              value={count(s.inputRecords)}
            />
            <Row
              label="iOS Device Reach"
              asOf={s.reachAsOf}
              value={count(s.iosReach)}
            />
            <Row
              label="Android Device Reach"
              asOf={s.reachAsOf}
              value={count(s.androidReach)}
            />
            <Row
              label={METRIC_LABELS.reach}
              asOf={s.reachAsOf}
              value={count(s.cookieReach)}
            />
            <Row label="Data Source Method" value={s.dataSourceMethod ?? '-'} />
            <Row label="Data Source Detail" value={s.dataSourceDetail ?? '-'} />
            <Row label="Precision Level" value={s.precisionLevel ?? '-'} />
            <Row
              label="Date Last Refreshed (Full)"
              value={s.dateLastRefreshed ? formatDate(s.dateLastRefreshed) : '-'}
              last
            />
            {ESTIMATED_CATALOG_METRICS && (
              <p className="mt-2.5 text-[11.5px] leading-[1.5] text-muted2">
                The rate card, the media-share percentages and provenance are
                estimates derived from reach and distribution — the catalogue does
                not report them. Cookie, iOS and Android reach, the input record
                count, delivered impressions and the date added are reported.
              </p>
            )}
          </Section>

          {/* Its own section, alongside Configuration and Asset Overview: this
              is what the marketplace observed, not what the seller declared. */}
          <Section title="Marketplace performance">
            <MarketplacePerformance segment={s} />
          </Section>
        </div>
      </Tabs.Content>

      <Tabs.Content value="permissions" className="px-[26px] pb-10 pt-[22px]">
        <Section title="Access">
          <Row label="Request status" value={<span className="capitalize">{s.status}</span>} />
          <Row label="Data Seller" value={s.seller} />
          <Row label="Segment Type" value={s.segmentType ?? '-'} />
          <Row
            label="Destinations distributed"
            value={String(s.destinations.length)}
            last
          />
        </Section>
        <p className="mt-3 text-[12px] text-muted2">
          Per-destination permission grants and contract terms are managed in Admin and
          are not wired into this view yet.
        </p>
      </Tabs.Content>

      <Tabs.Content value="pricing" className="px-[26px] pb-10 pt-[22px]">
        <Section title="Rate card">
          <Row label="CPM" value={usd(s.cpm)} />
          <Row label="CPM Cap" value={usd(s.cpmCap)} />
          <Row label={METRIC_LABELS.cpc} value={usd(s.cpc)} />
          <Row
            label="Programmatic % of Media"
            value={pct(s.programmaticPctOfMedia)}
          />
          <Row
            label={METRIC_LABELS.pctMedia}
            value={pct(s.advertiserDirectPctOfMedia)}
            last
          />
        </Section>
        <p className="mt-3 text-[12px] text-muted2">
          Contract-specific rate cards are negotiated with the seller and can differ
          from the catalogue rates above.
        </p>
      </Tabs.Content>
    </Tabs.Root>
  )
}

function MarketplacePerformance({ segment: s }: { segment: SegmentDetail }) {
  const p = s.performance

  // The earned-label badges that used to head this section now sit in the sheet
  // header, under the tags.
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Kpi label="Buyers distributing" value={p.advertisersUsing90d} />
        <Kpi
          label={METRIC_LABELS.impressions}
          value={
            s.impressions90d == null ? '-' : formatReach(s.impressions90d)
          }
        />
        {/* Continuity needs a week-by-week series the catalogue snapshot has
            no equivalent of; measured reach stands in when it is absent. */}
        {p.weeksActive == null || p.weeksInWindow == null ? (
          <Kpi label="Cookie reach" value={formatReach(s.cookieReach)} />
        ) : (
          <Kpi
            label="Weeks active"
            value={`${p.weeksActive}/${p.weeksInWindow}`}
          />
        )}
      </div>

      {p.usageIndex.length > 0 && (
        <>
          <h6 className="sec-label mt-4">Usage index — last 6 months</h6>
          <UsageSparkline points={p.usageIndex} />
        </>
      )}

      <h6 className="sec-label mt-4">Where it&apos;s distributed</h6>
      {p.destinations.map((d) => (
        <div
          key={d.destination}
          className="flex items-center justify-between border-b border-line2 py-2 text-[12px]"
        >
          <span className="flex items-center gap-2">
            <DestinationChip destination={d.destination} size={16} />
            <b>{destinationMeta(d.destination).name}</b>
          </span>
          <span className="text-muted2">
            {USAGE_TEXT[d.usage]}
            {d.live ? '' : ' · not distributed'}
          </span>
        </div>
      ))}

      <h6 className="sec-label mt-4">How it earned its labels</h6>
      <LabelExplanations earned={p.earnedLabels} platformCount={s.platformCount} />

      <h6 className="sec-label mt-4">Evidence quality</h6>
      <Row
        label="Attribution confidence"
        value={p.evidence.attributionConfidence}
      />
      <Row
        label="Advertiser direct share"
        value={`${p.evidence.usageDirectlyAttributedPct}% of media`}
      />
      <Row
        label="Labels last recomputed"
        value={formatDate(p.evidence.labelsLastRecomputed)}
      />
      <Row
        label={windowLabel(p.evidence)}
        value={windowValue(p.evidence)}
        last
      />
      <p className="mt-2.5 text-[11.5px] leading-[1.55] text-muted2">
        Labels are computed from the segment&apos;s marketplace footprint — buyers,
        platforms and measured Connect reach — pooled across at least five buyers. They
        describe distribution and reach, not campaign outcomes.
      </p>
    </>
  )
}

/**
 * Stand-in for the seller's brand mark. The catalogue ships logos for
 * destinations, not for data sellers, so the seller name is set as a wordmark
 * rather than leaving the block the mockup shows empty.
 */
function SellerWordmark({ seller }: { seller: string }) {
  return (
    <div className="flex h-[92px] items-center justify-center rounded-lg border border-line bg-sand">
      <span className="px-6 text-center text-[26px] font-bold tracking-[-0.6px] text-ink2">
        {seller}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="rounded-md border border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between bg-sand px-3.5 py-2.5 text-left text-[13.5px] font-bold"
      >
        {title}
        <span className="text-[10px] text-muted">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-3.5 py-3">{children}</div>}
    </section>
  )
}

/** Label left, value right — the Asset Overview layout. */
function Row({
  label,
  value,
  asOf,
  last,
}: {
  label: string
  value: ReactNode
  /** ISO date the figure was measured, shown between label and value. */
  asOf?: string
  last?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 py-2 text-[12.5px]',
        !last && 'border-b border-line2',
      )}
    >
      <span className="font-semibold text-ink2">{label}</span>
      <span className="flex items-baseline gap-2 text-right">
        {asOf && <span className="text-[11.5px] text-muted2">({shortDate(asOf)})</span>}
        <span>{value}</span>
      </span>
    </div>
  )
}

/** Label above value — used where the value is a long path or paragraph. */
function Stacked({ label, value }: { label: string; value: string }) {
  return (
    <div className="pb-2.5 pt-1 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-line2">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-1 text-[13px] font-semibold leading-[1.45] text-ink2">
        {value}
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[7px] border border-line px-2.5 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-[3px] text-[19px] font-bold leading-none tracking-[-0.4px]">
        {value}
      </div>
    </div>
  )
}

function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

const count = (n?: number) => (n == null ? '-' : formatNumber(n))
const usd = (n?: number) => (n == null ? '-' : `$${n.toFixed(2)}`)
const pct = (n?: number) => (n == null ? '-' : `${n}%`)
