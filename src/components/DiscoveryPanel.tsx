import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AiDiscoveryResponse } from '@/api/types'
import { LabelBadge, PlatformBadge, TextBadge } from './Badge'
import { renderBold } from '@/lib/markdown'

interface DiscoveryPanelProps {
  onClose: () => void
  onAsk: (question: string) => void
  /**
   * Clears the answer. The result lives in the caller's mutation state, not
   * here, so starting over has to go back through it — and because the caller
   * also narrows the table to the answer's candidates, that narrowing lifts
   * with it.
   */
  onReset: () => void
  isPending: boolean
  result?: AiDiscoveryResponse
  error?: Error | null
}

/**
 * The chip is a starting point, not the question — the label reads as a
 * category so the panel stays scannable, and the prompt behind it is the
 * fully-formed brief the agent actually receives.
 */
const SUGGESTIONS = [
  {
    label: 'Demographic: Household Reach',
    prompt:
      'Show me the household-level segments with the strongest cross-device reach',
  },
  {
    label: 'Interest: Category Affinity',
    prompt:
      'Find interest and affinity segments I can activate on the most destinations',
  },
  {
    label: 'Purchase: Consumer Tech',
    prompt:
      'I need purchase-data segments for a consumer tech campaign. Give me the strongest ones',
  },
  {
    label: 'Lifestyle: Fitness & Wellness',
    prompt: 'Show me the widest-reaching lifestyle and fitness segments',
  },
]

export function DiscoveryPanel({
  onClose,
  onAsk,
  onReset,
  isPending,
  result,
  error,
}: DiscoveryPanelProps) {
  const [input, setInput] = useState('')

  const submit = (text: string) => {
    const q = text.trim()
    if (!q || isPending) return
    onAsk(q)
    setInput('')
  }

  /** Back to the empty panel: no answer, no error, no half-typed follow-up. */
  const startOver = () => {
    setInput('')
    onReset()
  }

  // Nothing to clear on a panel that was just opened, and clearing mid-flight
  // would only be undone when the answer in flight lands.
  const canReset = !isPending && Boolean(result || error || input)

  return (
    <div className="flex h-[939px] w-[499px] shrink-0 flex-col overflow-y-auto border-l border-line bg-white px-[26px] py-[22px]">
      <div className="flex items-center gap-2.5 text-[22px] text-ink">
        <span className="text-[19px] text-indigo">✦</span>
        AI Segment Discovery
        <button
          onClick={onClose}
          aria-label="Close discovery panel"
          className="ml-auto text-base text-muted hover:text-ink"
        >
          ✕
        </button>
      </div>

      {!result && !isPending && (
        <div className="mt-auto pt-8">
          <h2 className="text-[28px] font-semibold leading-[1.22] tracking-[-0.4px] text-ink">
            I can help you discover segments in the Data Marketplace
          </h2>
          <p className="mt-3.5 text-[14.5px] leading-[1.6] text-ink2">
            Start with a campaign brief or description of the segments you are looking
            for. This can include demographics, data sources, and other requirements.
            Or start with a suggested prompt.
          </p>
          <div className="mt-5 flex flex-col items-start gap-2.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => submit(s.prompt)}
                className="flex items-center gap-2.5 rounded-lg bg-indigo-soft px-3.5 py-2.5 text-left text-[14px] font-semibold text-ink transition-colors hover:bg-[#E4E0FF]"
              >
                <span className="text-[13px] text-indigo">✦</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="mb-[18px] mt-5 rounded-[10px] border border-[#E5E8EC] bg-[#F4F6F8] px-4 py-3.5">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.8px] text-muted2">
            You
          </div>
          <p className="text-[14.5px] leading-[1.5] text-ink2">{result.question}</p>
        </div>
      )}

      {isPending && <ThinkingState />}

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Could not reach the discovery service: {error.message}
        </div>
      )}

      {result && !isPending && (
        <div className="text-[14.5px] leading-[1.62] text-ink2">
          <p className="mb-3.5">{renderBold(result.lead)}</p>

          {result.recommendations.map((rec) => (
            <div
              key={rec.segmentId}
              className="mb-[11px] rounded-[10px] border border-line px-[15px] py-3.5 transition-colors hover:border-indigo"
            >
              <div className="text-[11.5px] font-bold tracking-[0.6px] text-muted2">
                {String(rec.rank).padStart(2, '0')} · MARKETPLACE SCORE{' '}
                {rec.marketplaceScore}
              </div>
              <Link
                to={`/segments/${rec.segmentId}`}
                className="my-[3px] block text-sm font-bold leading-[1.35] hover:text-indigo-ink hover:underline"
              >
                {rec.fullPath}
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {rec.labels
                  .filter((l) => l !== 'active_platforms')
                  .map((l) => (
                    <LabelBadge key={l} label={l} reason={rec.labelReasons?.[l]} />
                  ))}
                {rec.labels.includes('active_platforms') && (
                  <PlatformBadge
                    count={rec.platformCount}
                    reason={rec.labelReasons?.active_platforms}
                  />
                )}
                {rec.extraBadge && <TextBadge>{rec.extraBadge}</TextBadge>}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-4 text-[12.5px] text-[#3C4043]">
                {rec.meta.map((m, i) => (
                  <span key={i}>{renderBold(m)}</span>
                ))}
              </div>
              <div className="mt-2.5 flex gap-[7px] text-[12.5px] leading-[1.55] text-muted">
                <span className="font-bold text-green-deep">✦</span>
                <span>{rec.why}</span>
              </div>
            </div>
          ))}

          <div className="my-4 rounded-lg border border-[#E2DDFB] bg-[#F7F5FF] px-3.5 py-3 text-[12.5px] leading-[1.55] text-indigo-ink">
            {renderBold(result.note)}
          </div>

          <Evidence result={result} />
        </div>
      )}

      <div className={`pt-4 ${result || isPending || error ? 'mt-auto' : 'mb-auto'}`}>
        <div className="rounded-xl border border-[#D5D9DE] px-[15px] py-3.5 focus-within:border-indigo">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit(input)
              }
            }}
            rows={3}
            placeholder={
              result ? 'Ask a follow-up' : 'Describe what you are looking for'
            }
            className="w-full resize-none bg-transparent text-[14.5px] outline-none placeholder:text-muted2"
          />
          <div className="mt-3 flex items-center text-[13px] text-muted2">
            <button
              onClick={startOver}
              disabled={!canReset}
              className="hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:text-muted2"
            >
              ＋ New Exploration
            </button>
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || isPending}
              aria-label="Send"
              className="ml-auto flex h-[29px] w-[29px] items-center justify-center rounded-full text-[17px] text-muted transition-colors hover:bg-indigo-soft hover:text-indigo disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
            >
              ↑
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11.5px] text-[#9AA0A6]">
          AI-generated messages. Verify results or contact LiveRamp for help.
        </p>
      </div>
    </div>
  )
}

/**
 * The agent grounds every answer in cited fragments and, on the Text2SQL route,
 * the query it actually ran. Both are collapsed by default — they are there to
 * be checked, not read.
 */
function Evidence({ result }: { result: AiDiscoveryResponse }) {
  const { sqlUsed, sources } = result
  if (!sqlUsed && !sources?.length) return null

  return (
    <div className="mb-4 space-y-2">
      {sources?.length ? (
        <details className="rounded-lg border border-line px-3.5 py-2.5">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-ink2">
            Sources ({sources.length})
          </summary>
          <ul className="mt-2.5 space-y-2">
            {sources.map((src, i) => (
              <li key={i} className="text-[12px] leading-[1.5] text-muted">
                <span className="font-semibold text-ink2">{src.source}</span>
                <span className="ml-1.5 text-muted2">
                  · relevance {src.score.toFixed(2)}
                </span>
                <p className="mt-0.5 break-words font-mono text-[11px] text-muted2">
                  {src.text}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {sqlUsed ? (
        <details className="rounded-lg border border-line px-3.5 py-2.5">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-ink2">
            SQL the agent ran
          </summary>
          <pre className="mt-2.5 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.5] text-muted">
            {sqlUsed}
          </pre>
        </details>
      ) : null}
    </div>
  )
}

function ThinkingState() {
  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo" />
        Ranking segments by measured reach and distribution…
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-[10px] border border-line px-[15px] py-3.5">
          <div className="h-3 w-40 animate-pulse rounded bg-line2" />
          <div className="mt-2.5 h-4 w-4/5 animate-pulse rounded bg-line2" />
          <div className="mt-2.5 h-3 w-2/3 animate-pulse rounded bg-line2" />
        </div>
      ))}
    </div>
  )
}
