export type ExtractedReactions = {
  text: string
  reactions: string[]
}

const MAX_REACTION_LEN = 60

const normalizeReaction = (raw: string): string => raw.trim().replace(/\s+/g, ' ').slice(0, MAX_REACTION_LEN)

// Matches inline gestures/emotions (e.g. *bites lip*, (sigh), [gasps]) anywhere in text.
// Same delimiters as leading reactions but applied globally for speech-safe output.
const INLINE_GESTURE_RE = /\*([^*\n]{1,60})\*|\(([^)\n]{1,60})\)|\[([^\]\n]{1,60})\]|<([^>\n]{1,60})>/g

/**
 * Removes inline gesture/emotion annotations (e.g. *bites lip*, (sigh)) from text.
 * Use when preparing content for TTS so those annotations are not spoken.
 */
export function stripInlineGestures(input: string): string {
  const without = input.replace(INLINE_GESTURE_RE, '').trim()
  return without.replace(/\s+/g, ' ')
}

// Matches leading stage-direction style reactions like:
// *laughs* Hello
// (sigh) Hello
// [gasps] Hello
// <laughs> Hello
const LEADING_REACTION_RE = /^\s*(?:\*([^*\n]{1,60})\*|\(([^)\n]{1,60})\)|\[([^\]\n]{1,60})\]|<([^>\n]{1,60})>)\s*/

export function extractLeadingReactions(input: string): ExtractedReactions {
  let remaining = input
  const reactions: string[] = []

  // Pull multiple leading reactions:
  // *laughs* (sigh) Hello
  while (true) {
    const match = LEADING_REACTION_RE.exec(remaining)
    if (!match) break

    const raw = match[1] ?? match[2] ?? match[3] ?? match[4] ?? ''
    const normalized = normalizeReaction(raw)
    if (normalized.length > 0) reactions.push(normalized)

    remaining = remaining.slice(match[0].length)
  }

  return {
    text: remaining.replace(/^\s+/, ''),
    reactions
  }
}
