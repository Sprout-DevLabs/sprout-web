// Plain sprout output as panel lines: unindented lines are headings, and
// "… and 4 more" / "(runs 12 of 43…)" style lines are dimmed.
export type TermLine = { text: string; kind: 'head' | 'dim' | 'body' };

export function termLines(text: string, max = Infinity): TermLine[] {
  return text
    .trimEnd()
    .split('\n')
    .slice(0, max)
    .map((text) => ({
      text,
      kind: text && !text.startsWith(' ') ? 'head' : /^\s*(…|\(|\+\d)/.test(text) ? 'dim' : 'body',
    }));
}
