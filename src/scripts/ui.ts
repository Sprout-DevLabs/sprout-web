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
