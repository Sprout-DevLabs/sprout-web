import { REPO, formatStars } from '../lib/github';
// Small page-wide behaviours: the nav's border once you scroll, and copy buttons.

export function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  update();
  addEventListener('scroll', update, { passive: true });
}

export function initCopy(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? '');
        btn.classList.add('copied');
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.setAttribute('aria-label', `Copy: ${btn.dataset.copy}`);
        }, 1600);
      } catch {
        // Clipboard blocked (e.g. insecure context): select the text instead.
        const txt = btn.querySelector('.txt');
        if (txt) getSelection()?.selectAllChildren(txt);
      }
    });
  });
}

// The star count built into the page is up to 6 hours old: refresh it once
// per visit. Below the threshold it stays hidden, and failures change nothing.
export async function initStars() {
  const btns = document.querySelectorAll<HTMLAnchorElement>('.star-btn');
  if (!btns.length) return;
  let n: number | undefined;
  try {
    const cached = sessionStorage.getItem('sprout-stars');
    if (cached) n = Number(cached);
  } catch {}
  if (n === undefined) {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}`);
      if (!res.ok) return;
      n = (await res.json()).stargazers_count;
      if (typeof n !== 'number') return;
      try {
        sessionStorage.setItem('sprout-stars', String(n));
      } catch {}
    } catch {
      return;
    }
  }
  btns.forEach((btn) => {
    const count = btn.querySelector<HTMLElement>('[data-star-count]');
    const text = btn.querySelector<HTMLElement>('[data-star-n]');
    if (!count || !text || n === undefined || n < Number(btn.dataset.starThreshold ?? Infinity)) return;
    text.textContent = formatStars(n);
    count.hidden = false;
    btn.setAttribute('aria-label', `Star on GitHub: ${n} stars`);
  });
}
