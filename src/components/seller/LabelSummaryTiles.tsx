import type { SellerLabelFilter, SellerSummaryTile } from '@/api/types'
import { cn } from '@/lib/cn'

interface Props {
  tiles: SellerSummaryTile[] | undefined
  active: SellerLabelFilter | ''
  onSelect: (key: SellerLabelFilter | '') => void
}

export function LabelSummaryTiles({ tiles, active, onSelect }: Props) {
  const items = tiles ?? PLACEHOLDERS

  return (
    <div className="mb-[18px] mt-0.5 grid grid-cols-6 gap-2.5">
      {items.map((t) => (
        <button
          key={t.key}
          aria-pressed={active === t.key}
          onClick={() => onSelect(active === t.key ? '' : t.key)}
          className={cn(
            'rounded-lg border-[1.4px] bg-white px-3 py-[11px] text-left transition-colors',
            active === t.key
              ? 'border-indigo shadow-[0_0_0_2px_#EEEBFF]'
              : 'border-line hover:border-[#B9BDC4]',
          )}
        >
          <div
            className={cn(
              'text-[22px] font-bold tracking-[-0.5px]',
              t.tone === 'warn' && 'text-[#B3261E]',
              !tiles && 'text-transparent',
            )}
          >
            {tiles ? t.count : '0'}
          </div>
          <div className="mt-0.5 text-[11.5px] leading-[1.3] text-muted">{t.label}</div>
        </button>
      ))}
    </div>
  )
}

/** Keeps the tile row from collapsing while the summary loads. */
const PLACEHOLDERS: SellerSummaryTile[] = [
  { key: 'best_seller', label: 'Best sellers', count: 0, tone: 'default' },
  { key: 'top_campaign_spend', label: 'Top campaign spend', count: 0, tone: 'default' },
  { key: 'multi_platform', label: 'Multi-platform', count: 0, tone: 'default' },
  { key: 'rising', label: 'Rising', count: 0, tone: 'default' },
  { key: 'needs_attention', label: 'Need attention', count: 0, tone: 'warn' },
  { key: 'no_labels', label: 'No labels yet', count: 0, tone: 'default' },
]
