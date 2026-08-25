import type { ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'
import type { FacetOption } from '@/api/types'
import { Checkbox } from './Checkbox'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/labels'

interface FacetSection {
  title: string
  hint: string
  options: FacetOption[]
  selected: string[]
  onToggle: (value: string) => void
}

interface FacetDropdownProps {
  trigger: ReactNode
  sections: FacetSection[]
  onClearAll?: () => void
  align?: 'start' | 'end'
  width?: number
}

export function FacetDropdown({
  trigger,
  sections,
  onClearAll,
  align = 'start',
  width = 344,
}: FacetDropdownProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={8}
          style={{ width }}
          className="z-50 rounded-lg border border-[#D5D9DE] bg-white px-[17px] pb-3.5 pt-4 shadow-pop"
        >
          {sections.map((section, i) => (
            <div key={section.title}>
              {i > 0 && <hr className="my-3 border-line" />}
              <h4 className="mb-[3px] text-[12px] font-normal uppercase tracking-[0.7px] text-muted">
                {section.title}
              </h4>
              <p className="mb-[11px] text-[11.5px] leading-[1.4] text-muted2">
                {section.hint}
              </p>
              {section.options.map((opt) => {
                const checked = section.selected.includes(opt.value)
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[13.5px]"
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => section.onToggle(opt.value)}
                      label={opt.label}
                    />
                    <span>{opt.label}</span>
                    <span className="ml-auto text-[12px] tabular-nums text-muted2">
                      {formatNumber(opt.count)}
                    </span>
                  </label>
                )
              })}
            </div>
          ))}

          <div className="mt-3 flex gap-2">
            <Popover.Close
              className={cn(
                'flex-1 rounded-[5px] bg-indigo px-2 py-2.5 text-[13px] font-bold text-white',
                'transition-opacity hover:opacity-90',
              )}
            >
              Apply filters
            </Popover.Close>
            <button
              onClick={onClearAll}
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
