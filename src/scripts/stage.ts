import { animate } from 'motion';

// A stage of fixed-height lines keyed by identity. Lines that stay glide to
// their new row, new lines grow in where they belong, and removed lines fade
// out in place. Only transform and opacity animate, so the browser can run it
// on the compositor and it stays smooth even for 60 rows at once.

export interface Line {
  key: string;
  html: string;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const spring = { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 } as const;

// Motion tracks transforms per element; setting style.transform behind its
// back makes the next animation start from a stale value. Always place rows
// through Motion, instantly when no animation is wanted.
const place = (el: HTMLElement, y: number) => animate(el, { y, x: 0, opacity: 1 }, { duration: 0 });
const ease = [0.22, 1, 0.36, 1] as const;

export class Stage {
  private nodes = new Map<string, { el: HTMLElement; html: string }>();
  private lines: Line[] = [];

  // fixedRows: reserve room for this many rows so the page never shifts.
  constructor(
    private el: HTMLElement,
    private fixedRows = 0,
  ) {
    // Row height comes from CSS so breakpoints can change it; re-lay out then.
    new ResizeObserver(() => this.layout(false)).observe(el.parentElement ?? el);
  }

  private get row(): number {
    return parseFloat(getComputedStyle(this.el).getPropertyValue('--row')) || 22;
  }

  render(lines: Line[], { stagger = 0.018, maxStagger = 0.5 } = {}) {
    const reduced = reducedMotion();
    const next = new Set(lines.map((l) => l.key));
    const row = this.row;

    for (const [key, { el }] of this.nodes) {
      if (next.has(key)) continue;
      this.nodes.delete(key);
      if (reduced) {
        el.remove();
        continue;
      }
      el.style.zIndex = '0';
      animate(el, { opacity: 0, x: -10 }, { duration: 0.22, ease }).finished.then(() => el.remove());
    }

    let entering = 0;
    lines.forEach((line, i) => {
      const y = i * row;
      const known = this.nodes.get(line.key);
      if (!known) {
        const el = document.createElement('div');
        el.className = 'ln';
        el.innerHTML = line.html;
        this.el.append(el);
        this.nodes.set(line.key, { el, html: line.html });
        if (reduced) {
          place(el, y);
        } else {
          animate(
            el,
            { y: [y, y], x: [-12, 0], opacity: [0, 1] },
            { duration: 0.5, ease, delay: Math.min(entering++ * stagger, maxStagger) },
          );
        }
        return;
      }
      if (known.html !== line.html) {
        known.el.innerHTML = line.html;
        known.html = line.html;
        if (!reduced) {
          animate(known.el, { backgroundColor: ['rgba(91, 214, 138, 0.16)', 'rgba(91, 214, 138, 0)'] }, { duration: 1.4, ease });
        }
      }
      if (reduced) place(known.el, y);
      else animate(known.el, { y, x: 0, opacity: 1 }, spring);
    });

    this.lines = lines;
    this.resize();
  }

  // Height never animates (that would reflow everything below each frame):
  // it grows at once, and shrinks only after exiting rows have faded.
  private resize() {
    const rows = Math.max(this.lines.length, this.fixedRows);
    const h = rows * this.row;
    const now = parseFloat(this.el.style.height) || 0;
    if (h >= now) this.el.style.height = `${h}px`;
    else setTimeout(() => (this.el.style.height = `${Math.max(this.lines.length, this.fixedRows) * this.row}px`), 260);
  }

  private layout(animateIt: boolean) {
    if (!this.lines.length) return;
    const row = this.row;
    this.lines.forEach((line, i) => {
      const n = this.nodes.get(line.key);
      if (!n) return;
      if (animateIt) animate(n.el, { y: i * row }, spring);
      else place(n.el, i * row);
    });
    this.el.style.height = `${Math.max(this.lines.length, this.fixedRows) * row}px`;
  }
}

// Types text into an element, one character at a time. Resolves when done;
// a newer call cancels an older one.
let typing = 0;
export function typeInto(el: HTMLElement, text: string, perChar = 26): Promise<void> {
  const id = ++typing;
  if (reducedMotion()) {
    el.textContent = text;
    return Promise.resolve();
  }
  el.textContent = '';
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => {
      if (id !== typing) return resolve();
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, perChar);
      else resolve();
    };
    tick();
  });
}
