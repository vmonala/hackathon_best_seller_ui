import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import type { FacetOption } from '@/api/types'
import { Checkbox } from '../Checkbox'
import { formatNumber } from '@/lib/labels'
import { cn } from '@/lib/cn'

interface Props {
  label: string
  hint: string
  options: FacetOption[]
  selected: string[]
  onChange: (values: string[]) => void
  /** Chips shown inline before the rest collapse into "+N more". */
  maxTokens?: number
  width?: number
}

/**
 * Token-box multi-select: selections show as removable chips in the trigger,
 * the popover holds a searchable checkbox list. An empty selection means "all",
 * the same convention the buyer-side facets use.
 */
export function TokenMultiSelect({
  label,
  hint,
  options,
  selected,
  onChange,
  maxTokens = 2,
  width = 288,
}: Props) {
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  }, [options, search])

  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    )

  const labelFor = (value: string) =>
    options.find((o) => o.value === value)?.label ?? value

  const shown = selected.slice(0, maxTokens)
  const overflow = selected.length - shown.length
  // With nothing selected we still need something clickable in the box.
  const remaining = options.length - selected.length

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label} filter`}
          className={cn(
            'flex min-h-[38px] cursor-pointer flex-wrap items-center gap-[7px] rounded-[5px] border bg-white px-2.5 py-[5px]',
            selected.length ? 'border-indigo' : 'border-[#C9CDD3]',
          )}
        >
          <span className="text-[11px] text-muted2">{label}</span>
          {shown.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-[13px] bg-[#EEF0F2] px-2.5 py-0.5 text-[12px]"
            >
              {labelFor(value)}
              <button
                type="button"
                aria-label={`Remove ${labelFor(value)}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(selected.filter((v) => v !== value))
                }}
                className="text-[10px] text-muted2 hover:text-ink"
              >
                ✕
              </button>
            </span>
          ))}
          {overflow > 0 && (
            <span className="inline-flex items-center rounded-[13px] bg-[#EEF0F2] px-2.5 py-0.5 text-[12px]">
              +{overflow} more
            </span>
          )}
          {!selected.length && (
            <span className="text-[12px] text-muted2">
              All{remaining ? ` (${formatNumber(remaining)})` : ''}
            </span>
          )}
          <span className="text-[9px] text-muted2">▾</span>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          style={{ width }}
          className="z-50 rounded-lg border border-[#D5D9DE] bg-white px-[17px] pb-3.5 pt-4 shadow-pop"
        >
          <h4 className="mb-[3px] text-[12px] font-normal uppercase tracking-[0.7px] text-muted">
            {label}
          </h4>
          <p className="mb-[11px] text-[11.5px] leading-[1.4] text-muted2">{hint}</p>

          <label className="field mb-1.5 h-[32px] w-full gap-2">
            <span className="text-[12px] text-muted2">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="w-full border-0 bg-transparent text-[13px] outline-none"
            />
          </label>

          <div className="max-h-[240px] overflow-y-auto">
            {visible.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[13.5px]"
              >
                <Checkbox
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  label={opt.label}
                />
                <span className="truncate">{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="ml-auto pl-2 text-[12px] tabular-nums text-muted2">
                    {formatNumber(opt.count)}
                  </span>
                )}
              </label>
            ))}
            {!visible.length && (
              <p className="py-2 text-[12.5px] text-muted2">
                {options.length ? 'No matches.' : 'Nothing to filter on yet.'}
              </p>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Popover.Close className="flex-1 rounded-[5px] bg-indigo px-2 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
              Apply filters
            </Popover.Close>
            <button
              onClick={() => onChange([])}
              className="flex-1 rounded-[5px] border border-[#C9CDD3] px-2 py-2.5 text-[13px] text-[#3C4043] hover:bg-line2"
            >
              Clear all
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
