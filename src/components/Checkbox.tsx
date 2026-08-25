import { cn } from '@/lib/cn'

interface CheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[2.5px] border-[1.6px] transition-colors',
        checked || indeterminate
          ? 'border-indigo bg-indigo text-white'
          : 'border-[#9AA0A6] bg-white hover:border-indigo',
        className,
      )}
    >
      {indeterminate ? (
        <span className="block h-[2px] w-[7px] rounded bg-white" />
      ) : checked ? (
        <span className="text-[11px] leading-none">✓</span>
      ) : null}
    </button>
  )
}
