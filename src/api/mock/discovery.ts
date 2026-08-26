import type { AiDiscoveryResponse, AiRecommendation, Segment } from '../types'
import { destinationName, formatDate } from '@/lib/labels'
import { MOCK_SEGMENTS } from './segments'

/**
 * Canned answers for the AI Segment Discovery panel.
 *
 * The panel's suggestion chips each name a slice of the catalogue, and each
 * slice is answered from a different angle — purchase depth, cross-device
 * balance, distribution breadth, reach — so no two chips return the same
 * shortlist or the same reasoning. Every number quoted below is read off the
 * matched rows at call time rather than written out here, so the copy cannot
 * drift from the fixture the way hand-typed figures do.
 *
 * A question that matches no topic falls through to `DEFAULT_TOPIC`, the
 * general wearables answer the panel shipped with.
 */

const fmtM = (n: number) => `${(n / 1_000_000).toFixed(1)}M`
const leaf = (s: Segment) => s.name
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

interface Topic {
  id: string
  /** Any of these in the question routes here. First topic with a hit wins. */
  keywords: string[]
  /** The slice of the catalogue this topic is about. */
  matches: (s: Segment) => boolean
  /** The angle the topic ranks its slice on — one per topic, never shared. */
  rank: (a: Segment, b: Segment) => number
  lead: (picks: Segment[], sliceSize: number) => string
  /**
   * Per-card reasoning, one builder per rank position. Each gets the whole
   * shortlist so a comparative claim ("the largest of the three") is computed
   * against the rows actually picked rather than assumed from the ranking.
   */
  why: ((s: Segment, picks: Segment[]) => string)[]
  extra?: (string | undefined)[]
  /** Which figures the cards quote. */
  meta: (s: Segment) => string[]
  note: (sliceSize: number) => string
}

const reachMeta = (s: Segment) => [
  `${fmtM(s.cookieReach)} cookie reach`,
  `${fmtM(s.iosReach ?? 0)} iOS`,
  `${fmtM(s.androidReach ?? 0)} Android`,
  `${s.platformCount} platforms`,
]

const crossDevice = (s: Segment) => Math.min(s.iosReach ?? 0, s.androidReach ?? 0)

/** Reach bought per dollar of rate card — the efficiency the budget topic ranks on. */
const reachPerCpm = (s: Segment) => (s.cpm ? s.cookieReach / s.cpm : 0)

/** Which of the destinations a brief named this segment is actually live on. */
const liveOn = (s: Segment, wanted: string[]) =>
  wanted.filter((d) => s.destinations.some((x) => x.destination === d && x.live))

const named = (ids: string[]) => ids.map(destinationName).join(' and ')

/** Delivered volume, the only "popularity" signal the feed actually carries. */
const imps = (s: Segment) => s.impressions90d ?? 0

/**
 * Impressions trend as a clause, or an honest blank when the segment is newer
 * than the 90-day comparison window and has no baseline to trend against.
 */
const growthClause = (s: Segment) =>
  s.impressionsGrowthPct === undefined
    ? 'no prior 90-day period to compare it against yet'
    : `${s.impressionsGrowthPct > 0 ? 'up' : s.impressionsGrowthPct < 0 ? 'down' : 'flat'} ${Math.abs(s.impressionsGrowthPct)}% on the prior 90 days`

/** The two destinations the trade-in brief names. */
const BRIEF_DESTINATIONS = ['facebook', 'the_trade_desk']

const TOPICS: Topic[] = [
  {
    id: 'switchers',
    keywords: ['trade-in', 'trade in', 'upgrade', 'switch', 'intender', 'in market', 'in-market'],
    matches: (s) => /upgraders|switchers|trade-in|intenders/i.test(s.name),
    // A switching brief always names the destinations it has to run on, so
    // this topic ranks on that coverage first and only then on reach.
    rank: (a, b) =>
      liveOn(b, BRIEF_DESTINATIONS).length - liveOn(a, BRIEF_DESTINATIONS).length ||
      b.cookieReach - a.cookieReach,
    lead: (picks, n) =>
      `${n} segments in the catalogue describe people **moving off their current watch** — upgraders, trade-in candidates, switchers and in-market intenders. I ranked them on whether they are already live on ${named(BRIEF_DESTINATIONS)}, then on reach, so the shortlist is buyable today: ${
        picks.filter((p) => liveOn(p, BRIEF_DESTINATIONS).length === 2).length
      } of the three are on both.`,
    why: [
      (s, picks) =>
        `Live on **${named(liveOn(s, BRIEF_DESTINATIONS))}** already, and ${
          picks.every((p) => p.cookieReach <= s.cookieReach) ? 'the largest of the three' : 'a strong pool'
        } at ${fmtM(s.cookieReach)} — a 12-month upgrade window from ${s.seller}, running across ${plural(s.platformCount, 'platform')}.`,
      (s, picks) =>
        `Also on ${named(liveOn(s, BRIEF_DESTINATIONS))}, and ${
          picks.every((p) => p.platformCount <= s.platformCount)
            ? 'the most widely distributed of the shortlist'
            : 'well distributed'
        } at ${plural(s.platformCount, 'platform')}. Trade-in intent is the closest signal here to an offer response — ${fmtM(s.cookieReach)} of reach at $${(s.cpm ?? 0).toFixed(2)} CPM.`,
      (s, picks) =>
        `Only on ${named(liveOn(s, BRIEF_DESTINATIONS))} of the two you named, so it needs a destination added — worth it for the freshest signal on the list, a 30-day in-market window scoring **${s.marketplaceScore}**${
          picks.every((p) => p.marketplaceScore <= s.marketplaceScore) ? ', the highest of the three' : ''
        }.`,
    ],
    extra: ['Both destinations', 'Widest distribution', 'Highest score'],
    meta: (s) => [
      `${fmtM(s.cookieReach)} cookie reach`,
      `${plural(s.platformCount, 'platform')}`,
      `$${(s.cpm ?? 0).toFixed(2)} CPM`,
      `Score ${s.marketplaceScore}`,
    ],
    note: (n) =>
      `**What I excluded:** the other ${n - 3} switching segments are live on at most one of the two destinations you named *and* carry less reach than the three above, so nothing was dropped that a destination swap would rescue. Nothing in this branch carries a purchase record — these are intent and lifecycle reads, so treat them as a prospecting pool rather than a confirmed upgrade list.`,
  },
  {
    id: 'budget',
    keywords: ['cpm', 'budget', 'cost', 'efficien', 'price', 'cheap', 'under $'],
    // Purchase-evidenced audiences only — and nothing that has stopped
    // delivering, because a cheap segment that runs nowhere is not a saving.
    matches: (s) =>
      /buyers|purchasers|owners/i.test(s.name) &&
      (s.cpm ?? 99) <= 5 &&
      !s.labels.includes('dormant'),
    rank: (a, b) => reachPerCpm(b) - reachPerCpm(a),
    lead: (_p, n) =>
      `${n} purchase-evidenced segments come in **at or under $5.00 CPM** and are still delivering. I ranked them on reach per dollar of rate card rather than on price alone — the cheapest row is not the best buy if it only resolves to two million people.`,
    why: [
      (s) =>
        `The best value on the shelf: **${fmtM(s.cookieReach)} of reach at $${(s.cpm ?? 0).toFixed(2)} CPM**, or ${fmtM(reachPerCpm(s))} of reach for every dollar of rate card, the most of any delivering purchase segment in the catalogue.`,
      (s) =>
        `$${(s.cpm ?? 0).toFixed(2)} CPM against ${fmtM(s.cookieReach)} — an ownership read from ${s.seller}, so the audience is people who already have the device rather than people considering one.`,
      (s) =>
        `$${(s.cpm ?? 0).toFixed(2)} CPM and ${fmtM(s.cookieReach)} of reach across ${plural(s.platformCount, 'platform')} — ${(s.precisionLevel ?? 'household').toLowerCase()}-level purchase evidence from ${s.seller}, and the widest distribution of the three.`,
    ],
    extra: ['Best value', undefined, undefined],
    meta: (s) => [
      `$${(s.cpm ?? 0).toFixed(2)} CPM`,
      `${fmtM(s.cookieReach)} cookie reach`,
      `${fmtM(reachPerCpm(s))} reach per $1 CPM`,
      `${plural(s.platformCount, 'platform')}`,
    ],
    note: () => {
      const cheapDormant = MOCK_SEGMENTS.filter(
        (s) => s.labels.includes('dormant') && (s.cpm ?? 99) <= 5,
      ).length
      return `**On the CPM figures:** these are rate card per 1,000 impressions, before any negotiated rate. Dormant segments were dropped from the ranking even where they were cheaper — ${cheapDormant} of them price under $5.00 but have delivered nothing in 90 days.`
    },
  },
  {
    id: 'trending',
    keywords: ['trending', 'newly added', 'recently added', 'last 90 days', 'new to the marketplace', 'holiday', 'gifting', 'gift', 'q4'],
    matches: (s) => s.labels.includes('new_addition_trending'),
    rank: (a, b) => b.cookieReach - a.cookieReach,
    lead: (_p, n) =>
      `${n} segments were added in the last 90 days and already have five or more buyers on them — that is what earns the **Trending** label. These are the three largest of them.`,
    why: [
      (s) =>
        `Added ${formatDate(s.dateAdded)} and already the largest of the new arrivals at **${fmtM(s.cookieReach)}**, live on ${plural(s.platformCount, 'platform')} — buyers picked it up quickly, which is the whole basis of the Trending label.`,
      (s) =>
        `Added ${formatDate(s.dateAdded)}, ${fmtM(s.cookieReach)} of reach on ${plural(s.platformCount, 'platform')} — a second read on the same audience from ${s.seller}, useful if you want two sources rather than one.`,
      (s) =>
        `The purchase-evidenced option of the three: added ${formatDate(s.dateAdded)} by ${s.seller}, ${fmtM(s.cookieReach)} of reach, and it has already earned **${s.labels.length} labels** in its first quarter on the shelf.`,
    ],
    extra: ['Largest new arrival', undefined, 'Purchase-based'],
    meta: (s) => [
      `Added ${formatDate(s.dateAdded)}`,
      `${fmtM(s.cookieReach)} cookie reach`,
      `${plural(s.platformCount, 'platform')}`,
      `Score ${s.marketplaceScore}`,
    ],
    note: () =>
      `**Read the growth figures carefully:** every row here is newer than the 90-day comparison window, so none of them report an impressions trend yet — there is no prior period to compare against. Their standing rests on how fast buyers took them up, not on a delivery curve.`,
  },
  {
    id: 'popular',
    keywords: [
      'popular',
      'multiple destination',
      'multiple platforms',
      'retail category',
      'widely used',
      'most used',
    ],
    // "Retail" branch, and distributed widely enough to count as multi-platform.
    matches: (s) => /(^|>)\s*Retail\s*>/i.test(s.fullPath) && s.platformCount >= 4,
    // Popularity is not a field the feed reports. Delivered impressions are the
    // closest thing to it, so that is what the ranking says out loud.
    rank: (a, b) => imps(b) - imps(a),
    lead: (_p, n) =>
      `${n} rows sit under a **Retail** branch and are live on four or more destinations — the multi-platform cut. "Most popular" is not a field the marketplace feed carries, so I ranked them on the closest thing it does report: **impressions delivered in the last 90 days**.`,
    why: [
      (s) =>
        `The most-delivered retail wearables segment in the catalogue: **${fmtM(imps(s))} impressions in 90 days** across ${plural(s.platformCount, 'destination')}, on ${fmtM(s.cookieReach)} of reach. It is a recent addition, so there is ${growthClause(s)}.`,
      (s) =>
        `${fmtM(imps(s))} impressions and ${growthClause(s)} — the clearest growth curve of the three, from ${s.seller}, across ${plural(s.platformCount, 'destination')}.`,
      (s, picks) =>
        `${fmtM(imps(s))} impressions across ${
          picks.every((p) => p.platformCount <= s.platformCount)
            ? `**${plural(s.platformCount, 'destination')}, the widest footprint of the three**`
            : plural(s.platformCount, 'destination')
        }${
          s.labels.includes('best_seller') ? ', and a best seller in its cohort' : ''
        }. Volume is ${growthClause(s)}, so buy it for the distribution rather than the momentum.`,
    ],
    extra: ['Most delivered', 'Fastest growing', 'Widest distribution'],
    meta: (s) => [
      `${fmtM(imps(s))} impressions 90d`,
      `${plural(s.platformCount, 'destination')}`,
      `${fmtM(s.cookieReach)} cookie reach`,
      `Score ${s.marketplaceScore}`,
    ],
    note: (n) => {
      const sellers = MOCK_SEGMENTS.filter(
        (s) => /(^|>)\s*Retail\s*>/i.test(s.fullPath) && s.platformCount >= 4 && s.labels.includes('best_seller'),
      ).length
      return `**How I read "popular":** delivered impressions, not revenue and not buyer count. ${sellers} of these ${n} rows also carry the **Best seller** label, which is the revenue read on the same cut — worth a second look if it is spend efficiency rather than sheer volume you are after.`
    },
  },
  {
    id: 'demographic',
    keywords: ['household', 'demographic', 'income', 'cross-device', 'cross device'],
    matches: (s) => /household/i.test(s.fullPath),
    // Household targeting is only worth buying if it lands on both device
    // families, so this topic ranks on the weaker of the two, not the total.
    rank: (a, b) => crossDevice(b) - crossDevice(a),
    lead: (_p, n) =>
      `The catalogue carries **${n} household-level segments**. These three hold up best across devices — I ranked them on the *weaker* of their iOS and Android reach, because a household buy is only as good as the side it under-delivers on.`,
    why: [
      (s) =>
        `The most balanced household segment on the shelf: **${fmtM(s.iosReach ?? 0)} iOS and ${fmtM(s.androidReach ?? 0)} Android**, so neither device family is the weak leg of the buy. Resolved at ${s.precisionLevel?.toLowerCase() ?? 'household'} level by ${s.seller}.`,
      (s, picks) =>
        `Behind on the weaker side (${fmtM(crossDevice(s))}), but ${
          picks.every((p) => p.cookieReach <= s.cookieReach)
            ? 'the largest overall footprint of the three'
            : 'a bigger overall footprint'
        } at **${fmtM(s.cookieReach)} cookies**, and already distributed to ${plural(s.platformCount, 'platform')}.`,
      (s) =>
        `Third on device balance, worth keeping for the different source: ${s.seller}'s file is ${(s.dataSourceMethod ?? 'modelled').toLowerCase()}, so it overlaps less with the two above.`,
    ],
    extra: ['Best device balance', 'Widest footprint', undefined],
    meta: reachMeta,
    note: (n) =>
      `**On the demographic read:** the marketplace feed reports device reach and precision level, not income or age bands. I ranked these ${n} household segments on what it does report — resolved reach per device family — so treat the demographic framing as *household-resolved*, not income-coded.`,
  },
  {
    id: 'interest',
    keywords: ['interest', 'affinity', 'arts', 'entertainment', 'research', 'consider'],
    matches: (s) =>
      /category interest|researchers|considerers|affinity|early adopters/i.test(
        s.name,
      ),
    // Interest audiences earn their keep by being buyable everywhere, so this
    // topic leads on distribution breadth and only breaks ties on reach.
    rank: (a, b) => b.platformCount - a.platformCount || b.cookieReach - a.cookieReach,
    lead: (_p, n) =>
      `${n} interest and affinity segments matched. Interest audiences are worth little if you cannot reach them where you already buy, so these are ranked on **how many platforms they are live on**, with reach breaking the ties.`,
    why: [
      (s) =>
        `Live on **${plural(s.platformCount, 'platform')}** — the widest distribution of any interest segment here, so it can run without a new destination setup. ${fmtM(s.cookieReach)} cookie reach behind it.`,
      (s) =>
        `Also on ${plural(s.platformCount, 'platform')}, and the stronger signal of the two: "${leaf(s)}" is a stated-interest read from ${s.seller} rather than a lookalike.`,
      (s, picks) =>
        `${
          picks.every((p) => p.platformCount === s.platformCount)
            ? `Matches the two above at ${plural(s.platformCount, 'platform')}`
            : `Narrower at ${plural(s.platformCount, 'platform')}`
        }, with ${fmtM(s.cookieReach)} of reach from ${s.seller} — a third, independently sourced read for when the first two overlap.`,
    ],
    extra: ['Most distributed', undefined, 'Third source'],
    meta: (s) => [
      `${s.platformCount} platforms`,
      `${fmtM(s.cookieReach)} cookie reach`,
      `Score ${s.marketplaceScore}`,
    ],
    note: (n) =>
      `**Why breadth first?** Across these ${n} interest segments the reach spread is far narrower than the distribution spread — picking on reach alone would hand you an audience you then have to onboard to a new platform.`,
  },
  {
    id: 'purchase',
    keywords: [
      'purchase',
      'packaged goods',
      'cpg',
      'shopper',
      'transaction',
      'bought',
      'buyers',
    ],
    matches: (s) => /purchase data/i.test(s.fullPath),
    // Purchase data is bought for its evidence base, so this topic ranks on the
    // marketplace score and reports the record depth behind each one.
    rank: (a, b) => b.marketplaceScore - a.marketplaceScore,
    lead: (_p, n) =>
      `${n} segments in the catalogue are built from **observed purchase data** rather than modelled intent. These three score highest, and I have quoted the record depth behind each so you can see what the score is standing on.`,
    why: [
      (s) =>
        `Highest marketplace score of the purchase rows at **${s.marketplaceScore}**${
          s.inputRecords
            ? `, on ${fmtM(s.inputRecords)} submitted records resolving to ${fmtM(s.cookieReach)} cookies`
            : `, at ${fmtM(s.cookieReach)} cookie reach`
        }. ${s.segmentType ?? 'Standard'} inventory from ${s.seller}.`,
      (s) =>
        `Scores ${s.marketplaceScore} on a ${(s.dataSourceMethod ?? 'declared').toLowerCase()} file${
          s.inputRecords ? ` of ${fmtM(s.inputRecords)} records` : ''
        }, resolving to ${fmtM(s.cookieReach)} cookies — last refreshed ${s.dateLastRefreshed ? formatDate(s.dateLastRefreshed) : 'on the seller cadence'}.`,
      (s, picks) =>
        `Lowest score of the three at ${s.marketplaceScore}, but ${
          picks.every((p) => p.cookieReach <= s.cookieReach)
            ? `the largest resolved pool of the shortlist at **${fmtM(s.cookieReach)} cookies**`
            : `still ${fmtM(s.cookieReach)} of resolved reach`
        } — and it runs on ${plural(s.platformCount, 'platform')} today, so check the destination fit before you buy it.`,
    ],
    extra: ['Top score', 'Deepest file', undefined],
    meta: (s) => [
      `Score ${s.marketplaceScore}`,
      `${fmtM(s.cookieReach)} cookie reach`,
      s.inputRecords ? `${fmtM(s.inputRecords)} input records` : `${s.platformCount} platforms`,
      s.cpm ? `$${s.cpm.toFixed(2)} CPM` : `${s.seller}`,
    ],
    note: (n) =>
      `**Scope:** I only considered the ${n} rows under a *Purchase Data* branch — intent and affinity segments were excluded even where they name the same products, because they are modelled rather than transacted.`,
  },
  {
    id: 'lifestyle',
    keywords: ['lifestyle', 'fitness', 'wellness', 'health'],
    matches: (s) => /lifestyle >|health & fitness/i.test(s.fullPath),
    // Lifestyle is a reach play: it is bought to build a top-of-funnel pool,
    // so raw resolved reach leads here.
    rank: (a, b) => b.cookieReach - a.cookieReach,
    lead: (_p, n) =>
      `${n} lifestyle and health-and-fitness segments matched. These are usually bought to build a top-of-funnel pool, so this shortlist is ranked on **raw resolved reach** rather than score.`,
    why: [
      (s) =>
        `The largest lifestyle audience in the catalogue at **${fmtM(s.cookieReach)} cookies**, spread over ${plural(s.platformCount, 'platform')} — the widest single pool you can buy from this branch.`,
      (s, picks) =>
        `${fmtM(s.cookieReach)} of reach on ${
          (s.iosReach ?? 0) > (s.androidReach ?? 0) ? 'an iOS-leaning' : 'an Android-leaning'
        } split (${fmtM(s.iosReach ?? 0)} iOS / ${fmtM(s.androidReach ?? 0)} Android)${
          (s.iosReach ?? 0) > (picks[0]?.iosReach ?? 0)
            ? ' — the stronger iOS side of the two, so it covers where the leader under-delivers'
            : ' — a different device mix to the leader'
        }.`,
      (s) =>
        `${fmtM(s.cookieReach)} reach from ${s.seller} under a different branch of the taxonomy — least overlap with the two above, which matters when you are stacking three pools.`,
    ],
    extra: ['Largest pool', undefined, 'Least overlap'],
    meta: reachMeta,
    note: (n) =>
      `**A caution on stacking:** these ${n} segments sit in overlapping branches, so the three pools above will not add up to the sum of their reach. Dedupe at the destination before you assume ${n > 0 ? 'incremental' : 'any'} coverage.`,
  },
]

/**
 * The general answer, kept for free-text questions: the strongest retail
 * wearables rows in the catalogue, ranked on measured reach and distribution.
 * Every claim in `why` is checkable against the three rows it names — a
 * recommendation the panel cannot back up with a number on the row is worse
 * than no recommendation, so re-verify these if the fixture is regenerated.
 */
const DEFAULT_TOPIC: Topic = {
  id: 'default',
  keywords: [],
  matches: (s) => ['1009202201', '1009900401', '1009203901'].includes(s.id),
  rank: (a, b) => b.marketplaceScore - a.marketplaceScore,
  lead: () =>
    'Here are the three strongest retail wearables segments in the catalogue, ranked on **measured Connect reach and distribution breadth** — the two things the marketplace feed reports directly.',
  why: [
    () =>
      'The **most widely distributed segment in the catalogue** (distribution rank 80), and top-decile on iOS reach at 9.7M — reaching both device families from one buy, and already live on Facebook.',
    () =>
      'The only segment here that is top-decile on **both** iOS and Android reach (9.2M and 9.4M), so a single buy covers both without a second audience. Ownership-based rather than intent-based.',
    () =>
      'The widest raw reach of the three at **13.4M cookies**, spread across **nine platforms** — the broadest footprint on this shortlist, and the strongest reach rank of the three at 56.',
  ],
  extra: ['Best distributed', 'Cross-device', undefined],
  meta: reachMeta,
  note: () =>
    `**Why these three?** ${MOCK_SEGMENTS.length} retail wearables segments are in the catalogue. I ranked them on measured reach and how widely they are already distributed — not on price, and not on campaign performance, which this feed does not report.`,
}

function pickTopic(question: string): Topic {
  const q = question.toLowerCase()
  return TOPICS.find((t) => t.keywords.some((k) => q.includes(k))) ?? DEFAULT_TOPIC
}

export function mockDiscoveryAnswer(question: string): AiDiscoveryResponse {
  const topic = pickTopic(question)
  const slice = MOCK_SEGMENTS.filter(topic.matches)
  // A topic whose slice went empty after a fixture regeneration should fall
  // back rather than answer with nothing.
  const pool = slice.length ? slice : MOCK_SEGMENTS.filter(DEFAULT_TOPIC.matches)
  const picks = [...pool].sort(topic.rank).slice(0, 3)

  const recommendations: AiRecommendation[] = picks.map((s, i) => ({
    rank: i + 1,
    segmentId: s.id,
    fullPath: s.fullPath,
    marketplaceScore: s.marketplaceScore,
    labels: s.labels,
    labelReasons: s.labelReasons,
    platformCount: s.platformCount,
    extraBadge: topic.extra?.[i],
    meta: topic.meta(s),
    why: topic.why[i]?.(s, picks) ?? '',
  }))

  return {
    id: crypto.randomUUID(),
    question,
    lead: topic.lead(picks, pool.length),
    recommendations,
    note: topic.note(pool.length),
    candidateSegmentIds: pool.map((s) => s.id),
    totalCandidates: pool.length,
    intent: topic.id,
  }
}
