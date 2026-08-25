import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import type { SellerLabel, SellerSegmentDetail } from '@/api/types'
import { useSellerSegment } from '@/api/queries'
import { GhostBadge, SellerBadge } from './SellerBadge'
import {
  DEMAND_LABELS,
  SELLER_LABEL_META,
  formatImpressions,
  formatUsd,
  isAttention,
} from '@/lib/sellerLabels'
import { formatDate } from '@/lib/labels'

interface Props {
  segmentId: string | null
  onClose: () => void
}

export function SegmentLabelDrawer({ segmentId, onClose }: Props) {
  const { data, isLoading, isError, error } = useSellerSegment(segmentId ?? undefined)

  return (
    <Dialog.Root open={Boolean(segmentId)} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(11,11,12,.34)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed right-0 top-0 z-50 h-screen w-[520px] max-w-[94vw] overflow-auto bg-white px-6 pb-10 pt-[22px] shadow-[-8px_0_34px_rgba(16,24,40,.18)] focus:outline-none"
        >
          <Dialog.Close className="absolute right-5 top-[18px] text-[17px] text-muted">
            ✕
          </Dialog.Close>
          {isError ? (
            <>
              <Dialog.Title className="text-[18px] font-bold">
                Could not load this segment
              </Dialog.Title>
              <p className="mt-2 text-[13px] text-muted">{(error as Error).message}</p>
            </>
          ) : !data ? (
            <>
              <Dialog.Title className="text-[18px] font-bold">
                {isLoading ? 'Loading…' : 'Segment'}
              </Dialog.Title>
            </>
          ) : (
            <DrawerBody segment={data} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerBody({ segment: s }: { segment: SellerSegmentDetail }) {
  const demand = s.labels.filter((l) => !isAttention(l))
  const attention = s.labels.filter(isAttention)
  // Two nearest misses only — the full list of unearned labels is noise here.
  const notEarned = DEMAND_LABELS.filter((l) => !s.labels.includes(l)).slice(0, 2)

  const scale = Math.max(s.buyersRequested, 1)
  const barWidth = (n: number) => `${Math.max(14, Math.round((n / scale) * 100))}%`

  return (
    <>
      <div className="text-[11px] font-bold uppercase tracking-[0.9px] text-muted2">
        Segment labels · DMS ID {s.id}
      </div>
      <Dialog.Title className="mb-2.5 mt-1.5 text-[18px] font-bold leading-[1.35]">
        {s.fullPath}
      </Dialog.Title>
      <div>
        {s.labels.length ? (
          s.labels.map((l) => <SellerBadge key={l} label={l} />)
        ) : (
          <GhostBadge>No labels earned yet</GhostBadge>
        )}
      </div>

      <div className="mb-1 mt-3.5 grid grid-cols-3 gap-2.5">
        <Kpi label="Revenue (90d)" value={formatUsd(s.revenue90d)} />
        <Kpi label="Impressions" value={formatImpressions(s.impressions90d)} />
        <Kpi label="Destinations live" value={String(s.destinations.length)} />
      </div>

      <h5 className="sec-label mt-[18px]">Buyer funnel</h5>
      <div className="flex flex-col gap-[7px]">
        <FunnelStep
          value={s.buyersRequested}
          width={barWidth(s.buyersRequested)}
          label="Requested"
        />
        <FunnelStep
          value={s.buyersDistributing}
          width={barWidth(s.buyersDistributing)}
          label="Distributing"
          drop={
            s.buyersRequested - s.buyersDistributing > 0
              ? `−${s.buyersRequested - s.buyersDistributing} dropped`
              : undefined
          }
        />
        <FunnelStep
          value={s.buyersWithRevenue}
          width={barWidth(s.buyersWithRevenue)}
          label="Generating revenue"
          drop={
            s.buyersDistributing - s.buyersWithRevenue > 0
              ? `−${s.buyersDistributing - s.buyersWithRevenue} not delivering`
              : undefined
          }
        />
      </div>

      <h5 className="sec-label mt-[22px]">Labels earned</h5>
      {demand.length ? (
        demand.map((l) => <Criterion key={l} label={l} />)
      ) : (
        <div className="text-[12px] text-muted2">
          None yet — this segment has not cleared a demand threshold in its cohort.
        </div>
      )}

      {attention.length > 0 && (
        <>
          <h5 className="sec-label mt-[22px]">Private to you</h5>
          {attention.map((l) => (
            <Criterion key={l} label={l} />
          ))}
        </>
      )}

      {notEarned.length > 0 && (
        <>
          <h5 className="sec-label mt-[22px]">Not earned</h5>
          {notEarned.map((l) => (
            <Criterion key={l} label={l} muted />
          ))}
        </>
      )}

      <h5 className="sec-label mt-[22px]">Evidence</h5>
      <Row
        label="Attribution confidence"
        value={<b>{s.evidence.attributionConfidence ?? '—'}</b>}
      />
      <Row
        label="Usage directly attributed"
        value={<b>{s.evidence.usageDirectlyAttributed}</b>}
      />
      <Row
        label="Labels last recomputed"
        value={formatDate(s.evidence.labelsLastRecomputed)}
      />
      <Row
        label="Reporting window"
        value={`${formatDate(s.evidence.reportingWindowStart)} – ${formatDate(
          s.evidence.reportingWindowEnd,
        )}`}
      />

      {s.suggestedAction && (
        <div className="mt-4 rounded-lg border border-[#D6CEFB] bg-indigo-soft px-3.5 py-3 text-[12.5px] leading-[1.55] text-indigo-ink">
          <b className="mb-1 block">Suggested action</b>
          {s.suggestedAction}
        </div>
      )}

      <div className="mt-3.5 rounded-lg border border-line bg-sand px-3.5 py-[11px] text-[11.5px] leading-[1.55] text-muted">
        Buyers see only the demand labels above, aggregated across at least five buyers.
        They never see your revenue, your buyer names or the private labels in this
        panel.
      </div>
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[7px] border border-line px-3 py-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-[3px] text-[20px] font-bold tracking-[-0.4px]">{value}</div>
    </div>
  )
}

function FunnelStep({
  value,
  width,
  label,
  drop,
}: {
  value: number
  width: string
  label: string
  drop?: string
}) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <div
        className="flex h-[22px] items-center rounded px-2 text-[11.5px] font-bold text-[#0A6B3C]"
        style={{ width, background: '#DFF6E9' }}
      >
        {value}
      </div>
      <span>{label}</span>
      {drop && <span className="text-[11.5px] font-bold text-[#B3261E]">{drop}</span>}
    </div>
  )
}

function Criterion({ label, muted }: { label: SellerLabel; muted?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-line2 py-2.5">
      <SellerBadge label={label} muted={muted} />
      <div
        className={`text-[12px] leading-[1.5] ${muted ? 'text-[#9AA0A6]' : 'text-muted'}`}
      >
        {SELLER_LABEL_META[label].criteria}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line2 py-2 text-[12.5px]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
