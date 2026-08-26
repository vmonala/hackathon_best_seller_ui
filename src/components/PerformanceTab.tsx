import type { ReactNode } from 'react'
import type { EvidenceQuality, SegmentDetail } from '@/api/types'
import { UsageSparkline } from './UsageSparkline'
import { destinationMeta, USAGE_TEXT, formatDate, formatReach } from '@/lib/labels'
import { DestinationChip } from './DestinationDots'
import { LabelExplanations } from './LabelChip'

export function PerformanceTab({ segment }: { segment: SegmentDetail }) {
  const p = segment.performance

  return (
    <div className="flex gap-[26px] px-6 pb-6 pt-[22px]">
      <div className="min-w-0 flex-[1.15]">
        <div className="flex gap-3">
          <Kpi
            label="Marketplace score"
            value={String(p.marketplaceScore)}
            sub={p.scorePercentileNote}
          />
          <Kpi
            label="Buyers distributing"
            value={p.advertisersUsing90d}
            sub={`Across ${p.destinationCount} platforms`}
          />
          {/* Continuity needs a week-by-week series. The marketplace catalogue
              is a snapshot, so the third KPI shows measured reach instead. */}
          {p.weeksActive == null || p.weeksInWindow == null ? (
            <Kpi
              label="Cookie reach"
              value={formatReach(segment.cookieReach)}
              sub={
                segment.reachAsOf
                  ? `Measured ${formatDate(segment.reachAsOf)}`
                  : 'Measured Connect reach'
              }
            />
          ) : (
            <Kpi
              label="Weeks active"
              value={
                <>
                  {p.weeksActive}
                  <span className="text-[15px] text-muted2">/{p.weeksInWindow}</span>
                </>
              }
              sub={
                p.weeksActive === p.weeksInWindow
                  ? 'Continuous use, no gaps'
                  : `${p.weeksInWindow - p.weeksActive} weeks inactive`
              }
            />
          )}
        </div>

        {p.usageIndex.length > 0 && (
          <>
            <h5 className="sec-label mt-[22px]">Usage index — last 6 months</h5>
            <UsageSparkline points={p.usageIndex} />
            <p className="mt-2 text-[11.5px] text-[#9AA0A6]">
              Indexed to the segment&apos;s own 6-month peak. Aggregated across all
              buyers.
            </p>
          </>
        )}

        <h5 className="sec-label mt-[22px]">Where it&apos;s distributed</h5>
        {p.destinations.map((d) => {
          const meta = destinationMeta(d.destination)
          return (
            <div
              key={d.destination}
              className="flex items-center justify-between border-b border-line2 py-2.5 text-[12.5px]"
            >
              <span className="flex items-center gap-2">
                <DestinationChip destination={d.destination} size={17} />
                <b>{meta.name}</b>
                {d.channel && ` · ${d.channel}`}
              </span>
              <span className="text-muted2">
                {USAGE_TEXT[d.usage]}
                {d.note && ` · ${d.note}`}
              </span>
            </div>
          )
        })}

        <div className="mt-4 rounded-[9px] border border-line bg-sand px-[15px] py-3.5 text-[12px] leading-[1.6] text-muted">
          <b className="text-ink2">What these labels are.</b> Labels are computed from
          the segment&apos;s marketplace record — how many buyers and platforms have it
          enabled, how far its measured Connect reach extends, how many impressions it
          delivered in the last 90 days, and when it was added — pooled across at least
          five buyers before anything is shown. Individual advertiser names, campaign
          details and spend figures are never exposed to other buyers or sellers.
          <br />
          <b className="text-ink2">What they are not.</b> They describe distribution,
          reach and delivered volume, not campaign outcomes: no label claims a segment
          performed well for an advertiser. A segment without labels is not a
          lower-quality segment — it may simply be niche, or distributed to fewer
          platforms.
        </div>
      </div>

      <div className="min-w-0 flex-[0.85]">
        <h5 className="sec-label mt-0">How it earned its labels</h5>
        <LabelExplanations
          earned={p.earnedLabels}
          platformCount={segment.platformCount}
        />

        <h5 className="sec-label mt-[22px]">Evidence quality</h5>
        <Row label="Attribution confidence" value={<b>{p.evidence.attributionConfidence}</b>} />
        <Row
          label="Advertiser direct share"
          value={
            <>
              <b>{p.evidence.usageDirectlyAttributedPct}%</b> of media
            </>
          }
        />
        <Row
          label="Shared ad-group allocation"
          value={`${p.evidence.sharedAdGroupAllocationPct}%`}
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

        <p className="mt-3 text-[11.5px] text-[#9AA0A6]">
          Sellers see the same panel for their own segments, plus a private view of
          which platforms their distribution has not reached.
        </p>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub: string
}) {
  return (
    <div className="flex-1 rounded-[9px] border border-line px-3.5 py-3">
      <div className="text-[11.5px] tracking-[0.3px] text-muted">{label}</div>
      <div className="mt-1 text-[25px] font-bold leading-none tracking-[-0.5px]">
        {value}
      </div>
      <div className="mt-[3px] text-[11.5px] text-muted2">{sub}</div>
    </div>
  )
}

function Row({
  label,
  value,
  last,
}: {
  label: string
  value: ReactNode
  last?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5 text-[12.5px]"
      style={{ borderBottom: last ? 'none' : '1px solid #F1F3F5' }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

/**
 * The evidence period. Marketplace segments are a point-in-time snapshot, so
 * their window collapses to the single date it was measured on; the seller feed
 * reports a real range.
 */
export function windowLabel(e: EvidenceQuality) {
  return e.reportingWindowStart === e.reportingWindowEnd
    ? 'Measured on'
    : 'Reporting window'
}

export function windowValue(e: EvidenceQuality) {
  return e.reportingWindowStart === e.reportingWindowEnd
    ? formatDate(e.reportingWindowEnd)
    : `${formatDate(e.reportingWindowStart)} – ${formatDate(e.reportingWindowEnd)}`
}
