import type { AgentAnswer, SqlRow } from '../backend'
import type { LiveCatalog } from './catalog'
import type { AiDiscoveryResponse, AiRecommendation } from '../types'

/**
 * Translates the agent branch of `/v1/segments?query=...` into the shape the
 * discovery panel renders.
 *
 * The agent returns prose plus its evidence — cited fragments, the SQL it ran
 * and the rows that came back. It does not return a ranked segment shortlist.
 * So the recommendation cards are reconstructed by pulling segment IDs out of
 * the SQL rows and resolving them against the catalog already in memory; rows
 * that name a segment the catalog does not hold are skipped rather than
 * rendered as a half-empty card.
 */

/** Column names the SQL rows use for a segment ID, most specific first. */
const ID_FIELDS = ['dms_segment_id', 'segment_id', 'id']

function idFrom(row: SqlRow): string | undefined {
  for (const key of ID_FIELDS) {
    const value = row.fields?.[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return undefined
}

/** Formats the row's other columns as the card's meta line. */
function metaFrom(row: SqlRow): string[] {
  return Object.entries(row.fields ?? {})
    .filter(([key]) => !ID_FIELDS.includes(key) && key !== 'segment_name')
    .slice(0, 4)
    .map(([key, value]) => {
      const name = key.replace(/_/g, ' ')
      const num =
        typeof value === 'number' ? value.toLocaleString('en-US') : String(value)
      return `${name} **${num}**`
    })
}

export function toDiscoveryResponse(
  answer: AgentAnswer,
  catalog: LiveCatalog,
): AiDiscoveryResponse {
  const { result } = answer
  const rows = result.sql_results ?? []

  const recommendations: AiRecommendation[] = []
  for (const row of rows) {
    const id = idFrom(row)
    const entry = id ? catalog.byId.get(id) : undefined
    if (!entry) continue

    const { segment } = entry
    recommendations.push({
      rank: recommendations.length + 1,
      segmentId: segment.id,
      fullPath: segment.fullPath,
      marketplaceScore: segment.marketplaceScore,
      labels: segment.labels,
      platformCount: segment.platformCount,
      meta: metaFrom(row),
      why: 'Returned by the query the agent ran against the marketplace usage tables.',
    })
  }

  const unresolved = rows.length - recommendations.length
  const noteParts = [
    `**Intent:** ${result.intent} · **Confidence:** ${Math.round(result.confidence * 100)}%.`,
  ]
  if (result.sources?.length) {
    const labels = [...new Set(result.sources.map((s) => s.source))].join(', ')
    noteParts.push(`Grounded in ${result.sources.length} cited fragment(s) from ${labels}.`)
  }
  if (unresolved > 0) {
    noteParts.push(
      `${unresolved} of ${rows.length} returned row(s) reference segments outside the loaded catalog and are not listed above.`,
    )
  }
  noteParts.push(
    'Labels reflect aggregated marketplace usage over the reporting window, not campaign outcomes for your KPIs.',
  )

  return {
    id: crypto.randomUUID(),
    question: answer.query,
    lead: result.answer,
    recommendations,
    note: noteParts.join(' '),
    candidateSegmentIds: recommendations.map((r) => r.segmentId),
    totalCandidates: rows.length,
    sqlUsed: result.sql_used ?? undefined,
    confidence: result.confidence,
    intent: result.intent,
    sources: result.sources?.map((s) => ({ source: s.source, text: s.text, score: s.score })),
  }
}
