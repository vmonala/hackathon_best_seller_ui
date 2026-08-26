import * as Tabs from '@radix-ui/react-tabs'
import { Link, useParams } from 'react-router-dom'
import { useSegment } from '@/api/queries'
import { LabelBadge, TextBadge } from '@/components/Badge'
import { PerformanceTab } from '@/components/PerformanceTab'
import { DestinationChip, DestinationDots } from '@/components/DestinationDots'
import {
  destinationName,
  USAGE_TEXT,
  formatDate,
  formatNumber,
  formatReach,
} from '@/lib/labels'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'reach', label: 'Reach' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'performance', label: 'Marketplace performance' },
  { value: 'destinations', label: 'Destinations' },
]

export function SegmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: segment, isLoading, isError, error } = useSegment(id)

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-[34px] py-[30px]">
        <div className="h-4 w-64 animate-pulse rounded bg-line2" />
        <div className="mt-4 h-7 w-2/3 animate-pulse rounded bg-line2" />
        <div className="mt-8 h-64 animate-pulse rounded-xl bg-line2" />
      </div>
    )
  }

  if (isError || !segment) {
    return (
      <div className="flex-1 px-[34px] py-[30px]">
        <Link to="/segments" className="text-[13px] text-indigo-ink hover:underline">
          ← Back to segments
        </Link>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Could not load this segment: {(error as Error)?.message ?? 'Not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-[34px] pb-[34px] pt-[30px]">
      <Link
        to="/segments"
        className="mb-4 inline-block text-[13px] text-indigo-ink hover:underline"
      >
        ← Back to segments
      </Link>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="px-6 pt-5">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.9px] text-muted2">
            Segment details · DMS ID {formatNumber(Number(segment.id))}
          </div>
          <h2 className="my-[7px] mb-2.5 text-[23px] font-bold tracking-[-0.3px]">
            {segment.fullPath}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {segment.labels
              .filter((l) => l !== 'proven_multi_platform')
              .map((l) => (
                <LabelBadge key={l} label={l} />
              ))}
            {segment.labels.includes('proven_multi_platform') && (
              <span className="bdg bdg-multi">
                <span className="text-[10.5px]">◈</span>
                Proven on {segment.platformCount} platforms
              </span>
            )}
            <TextBadge>
              {segment.category}
              {segment.iabCategory ? ` · ${segment.iabCategory}` : ''}
            </TextBadge>
          </div>
        </div>

        <Tabs.Root defaultValue="performance">
          <Tabs.List className="mt-[18px] flex gap-[26px] border-b border-line px-6">
            {TABS.map((t) => (
              <Tabs.Trigger
                key={t.value}
                value={t.value}
                className="py-3 text-[13.5px] text-muted transition-colors data-[state=active]:font-bold data-[state=active]:text-indigo-ink data-[state=active]:shadow-[inset_0_-2.5px_0_#4B3FD1]"
              >
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="performance">
            <PerformanceTab segment={segment} />
          </Tabs.Content>

          <Tabs.Content value="overview" className="px-6 py-6">
            <dl className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              <Field label="Seller" value={segment.seller} />
              <Field label="Status" value={segment.status} />
              <Field label="Category" value={segment.category} />
              <Field label="IAB category" value={segment.iabCategory ?? '—'} />
              <Field label="Date added" value={formatDate(segment.dateAdded)} />
              <Field label="Marketplace score" value={String(segment.marketplaceScore)} />
            </dl>
          </Tabs.Content>

          <Tabs.Content value="reach" className="px-6 py-6">
            <dl className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              <Field label="Cookie reach" value={formatReach(segment.cookieReach)} />
              <Field
                label="Advertiser Direct % of media"
                value={`${segment.advertiserDirectPctOfMedia}%`}
              />
              <Field label="Active platforms" value={String(segment.platformCount)} />
            </dl>
            <p className="mt-4 text-[12px] text-muted2">
              Device- and channel-level reach breakdowns are not wired up yet.
            </p>
          </Tabs.Content>

          <Tabs.Content value="pricing" className="px-6 py-6">
            <dl className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              <Field label="CPC" value={`$${segment.cpc.toFixed(2)}`} />
              <Field
                label="Est. CPM"
                value={`$${(segment.cpc * 8.4).toFixed(2)}`}
              />
            </dl>
            <p className="mt-4 text-[12px] text-muted2">
              Contract-specific rate cards are not wired up yet.
            </p>
          </Tabs.Content>

          <Tabs.Content value="destinations" className="px-6 py-6">
            <div className="mb-4">
              <DestinationDots destinations={segment.destinations} />
            </div>
            {segment.destinations.map((d) => (
              <div
                key={d.destination}
                className="flex items-center justify-between border-b border-line2 py-2.5 text-[12.5px]"
              >
                <span className="flex items-center gap-2">
                  <DestinationChip destination={d.destination} size={17} />
                  <b>{destinationName(d.destination)}</b>
                  {d.channel && ` · ${d.channel}`}
                </span>
                <span className="text-muted2">
                  {USAGE_TEXT[d.usage]}
                  {d.live ? ' · live' : ' · not delivering'}
                </span>
              </div>
            ))}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11.5px] uppercase tracking-[0.4px] text-muted2">{label}</dt>
      <dd className="mt-0.5 font-semibold capitalize text-ink2">{value}</dd>
    </div>
  )
}
