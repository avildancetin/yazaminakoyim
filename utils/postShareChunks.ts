// Shared between the share-image route (server) and SharePostButton (client) so
// both agree on identical chunk boundaries for the "full text, multiple images" flow.

export const PART_MAX_CHARS = 600
export const PART_MAX_LINES = 14
export const PART_MAX_CHARS_WITH_MEDIA = 280
export const PART_MAX_LINES_WITH_MEDIA = 8
export const PART_FONT_SIZE = 36

// A post's image is shown on every part (not just the first) so each slide stands
// on its own — that leaves less vertical room for text per part.
export function getPartLimits(hasMedia: boolean) {
  return hasMedia
    ? { maxChars: PART_MAX_CHARS_WITH_MEDIA, maxLines: PART_MAX_LINES_WITH_MEDIA }
    : { maxChars: PART_MAX_CHARS, maxLines: PART_MAX_LINES }
}

function fitsLimits(text: string, maxChars: number, maxLines: number) {
  return text.length <= maxChars && text.split('\n').length <= maxLines
}

// Index of the last character allowed while respecting both the char and line budgets.
function limitIndex(text: string, maxChars: number, maxLines: number) {
  let cut = Math.min(maxChars, text.length)

  const lines = text.split('\n')
  if (lines.length > maxLines) {
    let idx = 0
    for (let i = 0; i < maxLines; i++) {
      idx += lines[i].length + 1 // +1 for the newline joining this line to the next
    }
    cut = Math.min(cut, idx - 1)
  }

  return cut
}

export function splitContentIntoChunks(
  content: string,
  maxChars: number,
  maxLines: number = Infinity
): string[] {
  if (fitsLimits(content, maxChars, maxLines)) return [content]

  const chunks: string[] = []
  let remaining = content

  while (remaining.length > 0) {
    if (fitsLimits(remaining, maxChars, maxLines)) {
      chunks.push(remaining)
      break
    }

    const cut = limitIndex(remaining, maxChars, maxLines)
    let breakAt = remaining.lastIndexOf('\n', cut)
    if (breakAt < cut * 0.5) {
      const spaceBreak = remaining.lastIndexOf(' ', cut)
      breakAt = spaceBreak > 0 ? spaceBreak : cut
    }
    if (breakAt <= 0) breakAt = cut

    chunks.push(remaining.slice(0, breakAt).trimEnd())
    remaining = remaining.slice(breakAt).trimStart()
  }

  return chunks
}
