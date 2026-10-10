import { animate, inView, scroll, stagger } from 'motion';

// Site-wide motion: section headings rise word by word, panels spring in,
// lists cascade, figures count up, a progress line tracks the page,
// and a pill follows the pointer across the nav links. Only transform and opacity animate,
// so it all runs on the compositor. With reduced motion, nothing moves.

const ease = [0.22, 1, 0.36, 1] as const;
const spring = { type: 'spring', stiffness: 170, damping: 24, mass: 1 } as const;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setupMotion() {
  if (reducedMotion()) return;
  document.documentElement.classList.add('moving');
  progress();
  headings();
  panels();
  cascades();
  counts();
  navPill();
}

// A thin line under the nav fills as you read.
function progress() {
  const bar = document.querySelector<HTMLElement>('.progress');
  if (!bar) return;
  scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
}

// Headings rise out of a mask, one word after another, then their lead.
function headings() {
  document.querySelectorAll<HTMLElement>('main .section h2, main .page-head h1').forEach((h) => {
    if (h.closest('.hero') || h.dataset.split) return;
    h.dataset.split = '1';
    h.setAttribute('aria-label', h.textContent!.trim());
    // Each word (and each inline element, like <code>) gets its own mask.
    const pieces = [...h.childNodes].flatMap<string | Node>((node) =>
      node.nodeType === Node.TEXT_NODE ? node.textContent!.split(/(\s+)/).filter(Boolean) : [node],
    );
    h.textContent = '';
    for (const piece of pieces) {
      if (typeof piece === 'string' && /^\s+$/.test(piece)) {
        h.append(piece);
        continue;
      }
      const mask = document.createElement('span');
      mask.className = 'wm';
      mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.append(piece);
      mask.append(inner);
      h.append(mask);
    }
    const inner = h.querySelectorAll<HTMLElement>('.wi');
    const after = [...(h.parentElement?.querySelectorAll<HTMLElement>(':scope > .lead, :scope > p, :scope > .remote, :scope > .more') ?? [])];
    animate(inner, { y: '110%' }, { duration: 0 });
    animate(after, { opacity: 0, y: 18 }, { duration: 0 });
    inView(
      h,
      () => {
        animate(inner, { y: ['110%', '0%'] }, { duration: 0.9, ease, delay: stagger(0.055) });
        animate(after, { opacity: [0, 1], y: [18, 0] }, { duration: 0.8, ease, delay: stagger(0.08, { startDelay: 0.25 + inner.length * 0.04 }) });
      },
      { amount: 0.6 },
    );
  });
}

// Panels rise in on a spring as they enter.
function panels() {
  document.querySelectorAll<HTMLElement>('main .panel').forEach((p) => {
    if (p.closest('.hero')) return; // the hero panel has its own entrance
    animate(p, { opacity: 0, y: 56, scale: 0.97 }, { duration: 0 });
    inView(p, () => void animate(p, { opacity: 1, y: 0, scale: 1 }, { ...spring, opacity: { duration: 0.5, ease } }), { amount: 0.15 });
  });
}

// Lists of things (feature flags, benchmark cards, install options) cascade in.
function cascades() {
  document.querySelectorAll<HTMLElement>('[data-cascade]').forEach((list) => {
    const items = [...list.children] as HTMLElement[];
    animate(items, { opacity: 0, y: 28 }, { duration: 0 });
    inView(list, () => void animate(items, { opacity: [0, 1], y: [28, 0] }, { duration: 0.7, ease, delay: stagger(0.06) }), { amount: 0.2 });
  });
}

// Big figures count up from zero: "−39%" runs −1%, −2%, … −39%. The width
// is held so nothing beside the number shifts while it counts.
function counts() {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const m = el.textContent!.match(/^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const [, pre, num, post] = m;
    const target = Number(num.replace(/,/g, ''));
    const decimals = num.includes('.') ? num.split('.')[1].length : 0;
    const final = el.textContent!;
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;
    el.style.display = 'inline-block';
    // Screen readers get the real value; only the counting copy is visual.
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = final;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    el.replaceChildren(label, visual);
    const show = (v: number) =>
      (visual.textContent = pre + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + post);
    show(0);
    inView(
      el,
      () =>
        void animate(0, target, { duration: 1.4, ease, onUpdate: show }).then(() => {
          visual.textContent = final;
        }),
      { amount: 0.8 },
    );
  });
}

// One pill glides between nav links under the pointer, instead of each
// link lighting up on its own.
function navPill() {
  const wrap = document.querySelector<HTMLElement>('.nav .wrap');
  if (!wrap || !matchMedia('(hover: hover)').matches) return;
  const pill = document.createElement('span');
  pill.className = 'nav-pill';
  pill.setAttribute('aria-hidden', 'true');
  wrap.prepend(pill);
  wrap.classList.add('has-pill');
  let shown = false;
  const glide = { type: 'spring', stiffness: 520, damping: 40 } as const;
  wrap.querySelectorAll<HTMLElement>('.nav-link').forEach((link) => {
    link.addEventListener('pointerenter', () => {
      const to = { x: link.offsetLeft, y: link.offsetTop, width: link.offsetWidth, height: link.offsetHeight };
      if (!shown) animate(pill, to, { duration: 0 });
      else animate(pill, to, glide);
      animate(pill, { opacity: 1, scale: 1 }, { duration: 0.18 });
      shown = true;
    });
  });
  wrap.addEventListener('pointerleave', () => {
    shown = false;
    animate(pill, { opacity: 0, scale: 0.92 }, { duration: 0.2 });
  });
}
