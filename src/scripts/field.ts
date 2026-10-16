// The hero's background: a dot grid, like survey paper, that ripples in from
// the logo on load. A few dots glow softly and fade, like lights on a map,
// and dots near the pointer light up. One canvas, about 2,000 dots per
// frame; it pauses when the hero is off screen, and draws one still frame
// with reduced motion.

const GAP = 28;
const DOT = [198, 213, 190]; // sage
const LEAF = [79, 207, 130];
const GLOW = 3200; // how long one dot takes to brighten and fade, ms

type Glint = { i: number; j: number; born: number };

export function field(canvas: HTMLCanvasElement, still: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let w = 0, h = 0, cols = 0, rows = 0, ox = 0, oy = 0;
  let mx = -1e4, my = -1e4;
  let glints: Glint[] = [];
  let lastSpawn = 0, raf = 0, running = false;
  const t0 = performance.now();

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / GAP) + 1;
    rows = Math.ceil(h / GAP) + 1;
    ox = (w - (cols - 1) * GAP) / 2;
    oy = (h - (rows - 1) * GAP) / 2;
  }

  function spawn(now: number) {
    glints.push({ i: Math.floor(Math.random() * cols), j: Math.floor(Math.random() * rows), born: now });
  }

  function draw(now: number) {
    const t = now - t0;
    ctx!.clearRect(0, 0, w, h);
    // ripple out from the logo, which sits near the top centre
    const cx = w / 2, cy = Math.min(h * 0.22, 190);
    const reach = still ? 1e9 : t * 1.1;
    glints = glints.filter((g) => now - g.born < GLOW);
    const lit = new Map<number, number>();
    for (const g of glints) lit.set(g.i * 100000 + g.j, Math.sin(((now - g.born) / GLOW) * Math.PI));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = ox + i * GAP, y = oy + j * GAP;
        const d = Math.hypot(x - cx, y - cy);
        const shown = Math.min(1, Math.max(0, (reach - d) / 140));
        if (!shown) continue;
        // the wavefront itself is brighter as it passes
        const crest = still ? 0 : Math.max(0, 1 - Math.abs(reach - d) / 90) * Math.max(0, 1 - t / 2600);
        const near = Math.max(0, 1 - Math.hypot(x - mx, y - my) / 170);
        const glow = (lit.get(i * 100000 + j) ?? 0) * shown;
        const a = 0.16 * shown + 0.35 * crest + 0.55 * near * near + 0.6 * glow;
        const col = near > 0.05 || crest > 0.05 || glow > 0.05 ? LEAF : DOT;
        ctx!.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`;
        const s = 1.6 + 1.6 * Math.max(near, glow);
        ctx!.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
    if (!still && t > 1400 && now - lastSpawn > 260 && glints.length < 14) {
      spawn(now);
      lastSpawn = now;
    }
  }

  function loop(now: number) {
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  addEventListener('resize', () => { resize(); if (still) draw(performance.now()); });
  if (still) return draw(t0);
  const host = canvas.parentElement!;
  host.addEventListener('pointermove', (e) => {
    const b = canvas.getBoundingClientRect();
    mx = e.clientX - b.left;
    my = e.clientY - b.top;
  });
  host.addEventListener('pointerleave', () => { mx = my = -1e4; });
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
}
