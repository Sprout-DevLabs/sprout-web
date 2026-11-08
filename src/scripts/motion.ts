import { animate } from 'motion';

// Site-wide motion, kept to the pointer: a pill follows it across the nav
// links and cards light up under it. Content never animates on scroll; the
// logo sweep in Ground.astro is the one exception. With reduced motion,
// nothing moves.

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setupMotion() {
  if (reducedMotion()) return;
  document.documentElement.classList.add('moving');
  navPill();
  spotlight();
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

// Cards light up where the pointer is: the CSS draws the glow at --mx/--my.
function spotlight() {
  if (!matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-spot]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - b.left}px`);
      el.style.setProperty('--my', `${e.clientY - b.top}px`);
    });
  });
}
