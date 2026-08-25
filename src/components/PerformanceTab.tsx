import type { ReactNode } from 'react'
import type { SegmentDetail } from '@/api/types'
import { LabelBadge } from './Badge'
import { UsageSparkline } from './UsageSparkline'
import { DESTINATION_META, USAGE_TEXT, formatDate } from '@/lib/labels'
import { renderBold } from '@/lib/markdown'

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
            label="Advertisers using (90d)"
            value={p.advertisersUsing90d}
            sub={`Across ${p.destinationCount} destinations`}
          />
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
        </div>

        <h5 className="sec-label mt-[22px]">Usage index — last 6 months</h5>
        <UsageSparkline points={p.usageIndex} />
        <p className="mt-2 text-[11.5px] text-[#9AA0A6]">
          Indexed to the segment&apos;s own 6-month peak. Aggregated across all buyers.
        </p>

        <h5 className="sec-label mt-[22px]">Where it delivers</h5>
        {p.destinations.map((d) => {
          const meta = DESTINATION_META[d.destination]
          return (
            <div
              key={d.destination}
              className="flex items-center justify-between border-b border-line2 py-2.5 text-[12.5px]"
            >
              <span>
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
          aggregated, delivered marketplace usage — impressions and campaign activity
          that LiveRamp already collects for billing — pooled across at least five
          buyers before anything is shown. Individual advertiser names, campaign details
          and spend figures are never exposed to other buyers or sellers.
          <br />
          <b className="text-ink2">What they are not.</b> They describe marketplace
          demand, not campaign outcomes. A segment without labels is not a lower-quality
          segment — it may simply be new, niche, or running on destinations where usage
          is not yet reported automatically.
        </div>
      </div>

      <div className="min-w-0 flex-[0.85]">
        <h5 className="sec-label mt-0">How this segment earned its labels</h5>
        {p.earnedLabels.map((e, i) => (
          <div
            key={e.label}
            className="flex items-start gap-[11px] py-2.5"
            style={{
              borderBottom:
                i === p.earnedLabels.length - 1 ? 'none' : '1px solid #F1F3F5',
            }}
          >
            <LabelBadge label={e.label} muted={!e.earned} short />
            <div
              className={
                e.earned
                  ? 'text-[12.5px] leading-[1.5] text-muted'
                  : 'text-[12.5px] leading-[1.5] text-[#9AA0A6]'
              }
            >
              {renderBold(e.explanation)}
            </div>
          </div>
        ))}

        <h5 className="sec-label mt-[22px]">Evidence quality</h5>
        <Row label="Attribution confidence" value={<b>{p.evidence.attributionConfidence}</b>} />
        <Row
          label="Usage directly attributed"
          value={
            <>
              <b>{p.evidence.usageDirectlyAttributedPct}%</b> of impressions
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
          label="Reporting window"
          value={`${formatDate(p.evidence.reportingWindowStart)} – ${formatDate(p.evidence.reportingWindowEnd)}`}
          last
        />

        <p className="mt-3 text-[11.5px] text-[#9AA0A6]">
          Sellers see the same panel for their own segments, plus a private view of
          segments that are distributed but not delivering.
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
