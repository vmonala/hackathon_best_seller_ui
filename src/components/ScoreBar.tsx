import { cn } from '@/lib/cn'
import { scoreTone } from '@/lib/labels'

export function ScoreBar({ score }: { score: number }) {
  const tone = scoreTone(score)
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold tabular-nums">{score}</span>
      <span className="h-[5px] w-14 overflow-hidden rounded-[3px] bg-[#EDEFF1]">
        <span
          className={cn(
            'block h-full rounded-[3px]',
            tone === 'high' && 'bg-green-deep',
            tone === 'mid' && 'bg-[#F0A400]',
            tone === 'low' && 'bg-[#C6CACE]',
          )}
          style={{ width: `${score}%` }}
        />
      </span>
    </div>
  )
}
