import { PAGE_SIZE_OPTIONS } from '@/lib/useSegmentQueryParams'
import { formatNumber } from '@/lib/labels'
import { cn } from '@/lib/cn'

interface PagerProps {
  page: number
  pageSize: number
  /** Rows matching the current filters, across all pages. */
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

/**
 * Numbered pager for the segments list. The live catalogue runs to ~14.6k rows,
 * so the page numbers are windowed around the current one rather than listed in
 * full, and jumping straight to the last page stays one click away.
 */
export function Pager({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  // A stale `page=999` in the URL outlives the filter that made it valid, so
  // clamp before doing anything with it.
  const current = Math.min(Math.max(1, page), totalPages)

  const firstRow = total === 0 ? 0 : (current - 1) * pageSize + 1
  const lastRow = Math.min(current * pageSize, total)

  const go = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages)
    if (clamped !== current) onPageChange(clamped)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 text-[13px] text-[#3C4043]">
      <span className="tabular-nums">
        {total === 0 ? (
          'No segments'
        ) : (
          <>
            Showing <b>{formatNumber(firstRow)}</b>–<b>{formatNumber(lastRow)}</b> of{' '}
            <b>{formatNumber(total)}</b>
          </>
        )}
      </span>

      <label className="flex items-center gap-2 text-muted">
        Per page
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="cursor-pointer rounded-md border border-[#C9CDD3] bg-white px-2 py-1 font-bold text-ink outline-none focus:border-indigo"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="ml-auto flex items-center gap-1">
          <Step onClick={() => go(1)} disabled={current === 1} label="First page">
            «
          </Step>
          <Step
            onClick={() => go(current - 1)}
            disabled={current === 1}
            label="Previous page"
          >
            ‹
          </Step>

          {pageWindow(current, totalPages).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-muted2">
                …
              </span>
            ) : (
              <button
                key={item}
                onClick={() => go(item)}
                aria-current={item === current ? 'page' : undefined}
                className={cn(
                  'min-w-[30px] rounded-md border px-2 py-1 tabular-nums transition-colors',
                  item === current
                    ? 'border-indigo bg-indigo font-bold text-white'
                    : 'border-[#C9CDD3] bg-white hover:border-indigo hover:text-indigo-ink',
                )}
              >
                {item}
              </button>
            ),
          )}

          <Step
            onClick={() => go(current + 1)}
            disabled={current === totalPages}
            label="Next page"
          >
            ›
          </Step>
          <Step
            onClick={() => go(totalPages)}
            disabled={current === totalPages}
            label="Last page"
          >
            »
          </Step>
        </nav>
      )}
    </div>
  )
}

function Step({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="min-w-[30px] rounded-md border border-[#C9CDD3] bg-white px-2 py-1 transition-colors hover:border-indigo hover:text-indigo-ink disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#C9CDD3] disabled:hover:text-[#3C4043]"
    >
      {children}
    </button>
  )
}

/** First page, last page, and the current page with a neighbour either side. */
function pageWindow(current: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set([1, totalPages, current - 1, current, current + 1])
  const shown = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const out: (number | 'gap')[] = []
  shown.forEach((p, i) => {
    // A single skipped page is drawn rather than replaced by an ellipsis that
    // would take up the same room.
    if (i > 0 && p - shown[i - 1] === 2) out.push(p - 1)
    else if (i > 0 && p - shown[i - 1] > 2) out.push('gap')
    out.push(p)
  })
  return out
}
