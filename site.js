(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Hero: start the grow sequence once the fonts are in, so the headline
  // doesn't reflow halfway through drawing itself.
  const grow = () => document.documentElement.classList.add('grow');
  Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(grow);

  // Copy buttons.
  document.querySelectorAll('[data-copy]').forEach(btn => {
    const hint = btn.querySelector('.hint');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); hint.textContent = 'Copied'; }
      catch { hint.textContent = 'Select to copy'; }
      setTimeout(() => (hint.textContent = 'Copy'), 1600);
    });
  });

  // Docs: highlight the section being read.
  const aside = document.querySelector('.docs aside');
  if (aside) {
    const links = new Map([...aside.querySelectorAll('a[href^="#"]')].map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove('here'));
        links.get(e.target.id)?.classList.add('here');
      });
    }, { rootMargin: '0px 0px -75% 0px' });
    document.querySelectorAll('.docs h2[id]').forEach(h => io.observe(h));
  }

  const data = window.SPROUT_DEMO;
  if (!data) return;

  // Keyed rows: rows that persist stay put (and flash if their text
  // changed), new rows grow in where they belong, and removed rows shrink
  // away in place, so switching views reads as the tree changing.
  function reconcile(container, items) {
    container.querySelectorAll('.row.exit').forEach(el => el.remove());
    const existing = new Map([...container.children].map(el => [el.dataset.key, el]));
    const next = new Set(items.map(i => i.key));

    const trailing = new Map(); // persisting key (or null) -> removed rows that followed it
    let prev = null;
    for (const [key, el] of existing) {
      if (next.has(key)) { prev = key; continue; }
      if (!trailing.has(prev)) trailing.set(prev, []);
      trailing.get(prev).push(el);
    }

    // FLIP: remember where persisting rows are, so reordering (--sort size)
    // slides them to their new places instead of teleporting.
    const before = new Map();
    if (!reduced) for (const [key, el] of existing) if (next.has(key)) before.set(el, el.getBoundingClientRect().top);

    const order = [...(trailing.get(null) || [])];
    const entering = [];
    for (const item of items) {
      let el = existing.get(item.key);
      if (!el) {
        el = document.createElement('div');
        el.className = 'row' + (reduced ? '' : ' enter') + (item.wrap ? ' wrap' : '');
        el.dataset.key = item.key;
        el.innerHTML = `<span>${item.html}</span>`;
        entering.push(el);
      } else if (el.dataset.html !== item.html) {
        el.firstElementChild.innerHTML = item.html;
        el.classList.remove('changed');
        void el.offsetWidth;
        el.classList.add('changed');
      }
      el.dataset.html = item.html;
      order.push(el, ...(trailing.get(item.key) || []));
    }
    container.replaceChildren(...order);

    for (const [el, top] of before) {
      const dy = top - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      el.style.transition = 'none';
      el.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = '';
        el.style.transform = '';
      }));
    }

    for (const els of trailing.values()) {
      for (const el of els) {
        if (reduced) { el.remove(); continue; }
        el.classList.add('exit');
        setTimeout(() => el.remove(), 600);
      }
    }
    if (!reduced) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        entering.forEach((el, i) => {
          el.style.transitionDelay = `${Math.min(i * 22, 400)}ms`;
          el.classList.remove('enter');
          setTimeout(() => (el.style.transitionDelay = ''), 1000);
        });
      }));
    }
  }

  // ---------- views demo ----------

  const BARS = '▁▂▃▄▅▆▇█';

  // Same as sprout's humanSize: du -h style, powers of 1024.
  function humanSize(n) {
    if (n < 1024) return `${n}B`;
    let div = 1024, exp = 0;
    for (let m = Math.floor(n / 1024); m >= 1024; m = Math.floor(m / 1024)) { div *= 1024; exp++; }
    return (n / div).toFixed(1).replace(/\.0$/, '') + 'KMGTPE'[exp];
  }
  const SAY = {
    tree: 'The layout with .gitignore applied. The last line counts what was left out.',
    git: 'Uncommitted work on the feature branch: a new TODO, a deleted doc, and edits inside collapsed folders, counted on the folder.',
    churn: 'Commits per path over the project\'s history. web/src and internal/trails are where most of the work goes.',
    size: 'Sizes with true folder totals, largest first. Collapsed folders are still measured all the way down.',
    diff: 'Everything feature/offline-maps changed since it left main, nested in place, with lines added and removed per folder.',
  };

  function flatten(root) {
    const rows = [];
    (function walk(n, prefix) {
      (n.children || []).forEach((c, i) => {
        const last = i === n.children.length - 1;
        rows.push({ node: c, conn: prefix + (last ? '└── ' : '├── ') });
        if (c.type === 'directory') walk(c, prefix + (last ? '    ' : '│   '));
      });
    })(root, '');
    return rows;
  }

  // Same scaling as sprout's --churn: files against the busiest file,
  // directories against the busiest directory.
  function churnScale(rows) {
    const s = { file: 0, directory: 0 };
    rows.forEach(({ node }) => (s[node.type] = Math.max(s[node.type], node.churn || 0)));
    return s;
  }

  function label(n, scale, sizes) {
    let h = n.type === 'directory'
      ? `<span class="d">${esc(n.name)}/</span>`
      : n.status === 'D' ? `<span class="name-D">${esc(n.name)}</span>` : esc(n.name);
    if (sizes && (n.size > 0 || n.type !== 'directory')) h += `  <span class="ann sz">${humanSize(n.size || 0)}</span>`;
    if (n.status) h += `  <span class="ann st-${n.status}">${n.status}</span>`;
    if (n.changes) h += `  <span class="ann c">(${n.changes} changed)</span>`;
    if ((n.added || 0) + (n.deleted || 0) > 0) {
      h += `  <span class="ann"><span class="add">+${n.added || 0}</span> <span class="del">-${n.deleted || 0}</span></span>`;
    }
    if (n.churn) {
      const max = scale[n.type];
      const i = Math.floor((n.churn * 8 - 1) / max);
      const heat = n.churn * 3 > max * 2 ? 3 : n.churn * 3 > max ? 2 : 1;
      h += `  <span class="ann heat-${heat}" data-bar="${i}" data-n="${n.churn}">${BARS[i]} ${n.churn}</span>`;
    }
    return h;
  }

  // Churn bars climb to their height instead of appearing at it.
  function growBars(container) {
    if (reduced) return;
    container.querySelectorAll('[data-bar]').forEach(el => {
      const target = +el.dataset.bar, n = el.dataset.n;
      let i = 0;
      el.textContent = `${BARS[0]} ${n}`;
      const t = setInterval(() => {
        el.textContent = `${BARS[Math.min(++i, target)]} ${n}`;
        if (i >= target) clearInterval(t);
      }, 55);
    });
  }

  const modesEl = document.getElementById('modes');
  const rowsEl = document.getElementById('demo-rows');
  const cmdEl = document.getElementById('demo-cmd');
  const headEl = document.getElementById('demo-head');
  const sumEl = document.getElementById('demo-summary');
  let current = -1;

  const buttons = data.modes.map((m, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" aria-pressed="false" aria-controls="demo">${esc(m.cmd)}<span class="say">${esc(SAY[m.id])}</span><span class="timer"></span></button>`;
    modesEl.append(li);
    const b = li.firstElementChild;
    b.addEventListener('click', () => { stopAuto(); show(i); });
    return b;
  });

  function show(i) {
    if (i === current) return;
    current = i;
    const m = data.modes[i];
    buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    cmdEl.textContent = m.cmd;
    const [dir, ...rest] = m.header.split(' ');
    headEl.innerHTML = `${esc(dir)}${rest.length ? ` <span class="dim">${esc(rest.join(' '))}</span>` : ''}`;
    const rows = flatten(m.tree);
    const scale = churnScale(rows);
    reconcile(rowsEl, rows.map(r => ({ key: r.node.path, html: `<span class="c">${r.conn}</span>${label(r.node, scale, m.size)}` })));
    sumEl.textContent = m.summary;
    if (m.id === 'churn') growBars(rowsEl);
  }

  // Autoplay through the views once the demo is on screen, until the
  // visitor picks one. Hovering the output holds the current view.
  const DWELL = 5500;
  let timer = null, paused = false;
  modesEl.style.setProperty('--dwell', `${DWELL}ms`);
  function tick() {
    timer = setTimeout(() => {
      if (!paused) show((current + 1) % data.modes.length);
      tick();
    }, DWELL);
  }
  function stopAuto() { clearTimeout(timer); timer = null; modesEl.classList.remove('auto'); }
  const demo = document.getElementById('demo');
  demo.addEventListener('pointerenter', () => { paused = true; modesEl.classList.remove('auto'); });
  demo.addEventListener('pointerleave', () => { paused = false; if (timer) modesEl.classList.add('auto'); });

  show(0);
  if (!reduced) {
    new IntersectionObserver((entries, io) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      if (current === 0) { modesEl.classList.add('auto'); tick(); } // not if the visitor already chose
    }, { threshold: 0.35 }).observe(demo);
  }

  // ---------- --ai budget slider ----------

  const slider = document.getElementById('budget');
  const out = document.getElementById('budget-out');
  const aiCmd = document.getElementById('ai-cmd');
  const aiRows = document.getElementById('ai-rows');
  const ends = document.querySelector('.budget .ends');

  function aiLine(line) {
    let h = esc(line);
    if (/^#/.test(line)) return `<span class="d">${h}</span>`;
    if (/^\(truncated/.test(line)) return `<span class="st-M">${h}</span>`;
    h = h.replace(/^([a-z][a-z ()0-9d,]*?:)/, '<span class="c">$1</span>');
    return h.replace(/(\(\d+ files?[^)]*\))/, '<span class="c">$1</span>');
  }

  function showBudget(i) {
    const stop = data.ai[i];
    out.textContent = stop.budget;
    aiCmd.textContent = `sprout --ai --budget ${stop.budget}`;
    ends.children[1].textContent = i === data.ai.length - 1 ? 'everything fits' : 'everything';
    let inStructure = false;
    const items = stop.text.replace(/\n$/, '').split('\n').map((line, n) => {
      if (line.startsWith('## structure')) inStructure = true;
      let key = inStructure ? line.match(/^\s*\S+/)?.[0] ?? `blank${n}` : `h${n}:${line}`;
      if (line.startsWith('(truncated')) key = 'note';
      return { key, html: aiLine(line) || ' ', wrap: true };
    });
    reconcile(aiRows, items);
  }

  slider.max = data.ai.length - 1;
  slider.addEventListener('input', () => showBudget(+slider.value));
  showBudget(+slider.value);

  // ---------- --entry reading order ----------

  const entryEl = document.getElementById('entry-list');
  if (entryEl && data.entry) {
    const steps = data.entry.split('\n')
      .map(l => l.match(/^\s*(\d+)\.\s+(\S+)\s+(.*)$/)).filter(Boolean)
      .map(([, n, file, why]) => ({ n, file, why, used: +(why.match(/used by (\d+)/)?.[1] || 0) }));
    const most = Math.max(1, ...steps.map(s => s.used));
    entryEl.innerHTML = steps.map(s => `<li>
      <span class="n">${esc(s.n)}.</span><code class="f">${esc(s.file)}</code>
      <span class="why">${esc(s.why)}</span>
      <span class="bar" style="--w:${s.used ? s.used / most : 0}"></span></li>`).join('');
  }
})();

// ---------- install picker (works without the demo data) ----------
(() => {
  const tabs = [...document.querySelectorAll('[role="tab"][data-os]')];
  if (!tabs.length) return;
  const select = os => tabs.forEach(t => {
    const on = t.dataset.os === os;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.os));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length];
      select(n.dataset.os); n.focus();
    });
  });
  const p = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
  select(p.includes('win') ? 'windows' : p.includes('mac') ? 'macos' : p.includes('linux') ? 'linux' : 'macos');
})();
