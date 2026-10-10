// The hero's background: a dot grid, like survey paper, that ripples in from
// the logo on load. Traces wander across it like signals through an import
// graph, and dots near the pointer light up. One canvas, about 2,000 dots per
// frame; it pauses when the hero is off screen, and draws one still frame
// with reduced motion.

const GAP = 28;
const DOT = [198, 213, 190]; // sage
const LEAF = [79, 207, 130];
const GROW = 1100, HOLD = 500, FADE = 900; // trace lifetime, ms

type Trace = { pts: [number, number][]; born: number };

export function field(canvas: HTMLCanvasElement, still: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let w = 0, h = 0, cols = 0, rows = 0, ox = 0, oy = 0;
  let mx = -1e4, my = -1e4;
  let traces: Trace[] = [];
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

  // A walk along the grid that mostly keeps its heading, like a root.
  function spawn(now: number) {
    let c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * rows);
    const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let d = dirs[Math.floor(Math.random() * 4)];
    const pts: [number, number][] = [[c, r]];
    const steps = 6 + Math.floor(Math.random() * 10);
    for (let i = 0; i < steps; i++) {
      if (Math.random() < 0.35) {
        const turn = dirs.filter(([x, y]) => x !== -d[0] || y !== -d[1]);
        d = turn[Math.floor(Math.random() * turn.length)];
      }
      c += d[0];
      r += d[1];
      if (c < 0 || r < 0 || c >= cols || r >= rows) break;
      pts.push([c, r]);
    }
    if (pts.length > 3) traces.push({ pts, born: now });
  }

  function draw(now: number) {
    const t = now - t0;
    ctx!.clearRect(0, 0, w, h);
    // ripple out from the logo, which sits near the top centre
    const cx = w / 2, cy = Math.min(h * 0.22, 190);
    const reach = still ? 1e9 : t * 1.1;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = ox + i * GAP, y = oy + j * GAP;
        const d = Math.hypot(x - cx, y - cy);
        const shown = Math.min(1, Math.max(0, (reach - d) / 140));
        if (!shown) continue;
        // the wavefront itself is brighter as it passes
        const crest = still ? 0 : Math.max(0, 1 - Math.abs(reach - d) / 90) * Math.max(0, 1 - t / 2600);
        const near = Math.max(0, 1 - Math.hypot(x - mx, y - my) / 170);
        const a = 0.16 * shown + 0.35 * crest + 0.55 * near * near;
        const col = near > 0.05 || crest > 0.05 ? LEAF : DOT;
        ctx!.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`;
        const s = 1.6 + 1.6 * near;
        ctx!.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
    // traces grow, hold, and fade
    traces = traces.filter((tr) => now - tr.born < GROW + HOLD + FADE);
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';
    for (const tr of traces) {
      const age = now - tr.born;
      const grown = Math.min(1, age / GROW) * (tr.pts.length - 1);
      const fade = age > GROW + HOLD ? 1 - (age - GROW - HOLD) / FADE : 1;
      const whole = Math.floor(grown);
      const at = (k: number): [number, number] => [ox + tr.pts[k][0] * GAP, oy + tr.pts[k][1] * GAP];
      ctx!.beginPath();
      ctx!.moveTo(...at(0));
      for (let k = 1; k <= whole; k++) ctx!.lineTo(...at(k));
      let head = at(whole);
      if (whole < tr.pts.length - 1) {
        const [ax, ay] = at(whole), [bx, by] = at(whole + 1), f = grown - whole;
        head = [ax + (bx - ax) * f, ay + (by - ay) * f];
        ctx!.lineTo(...head);
      }
      ctx!.strokeStyle = `rgba(${LEAF[0]},${LEAF[1]},${LEAF[2]},${(0.4 * fade).toFixed(3)})`;
      ctx!.lineWidth = 1.4;
      ctx!.stroke();
      ctx!.fillStyle = `rgba(${LEAF[0]},${LEAF[1]},${LEAF[2]},${(0.9 * fade).toFixed(3)})`;
      ctx!.beginPath();
      ctx!.arc(head[0], head[1], 2.4, 0, Math.PI * 2);
      ctx!.fill();
    }
    if (!still && t > 1400 && now - lastSpawn > 650 && traces.length < 8) {
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
