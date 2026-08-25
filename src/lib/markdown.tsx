import { Fragment, type ReactNode } from 'react'

/**
 * Minimal **bold** renderer. Backend copy uses ** for emphasis; this keeps us
 * from pulling in a full markdown dependency for a single feature.
 */
export function renderBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <b key={i}>{part.slice(2, -2)}</b>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}
