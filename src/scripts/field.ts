// The hero's background: a living topographic map. Contour lines are traced
// (marching squares) through a slowly drifting noise field, so the terrain
// breathes; every fourth line is a brighter index contour, as on a survey
// sheet. The pointer raises a hill the lines wrap around, and on load the map
// unfolds outward from the logo. ~30 fps on one canvas, paused off screen;
// with reduced motion it draws one still frame.

const STEP = 16; // grid cell, css px
const LEVELS = 13;
const SAGE = '198,213,190';
const LEAF = '79,207,130';

// Smooth 3D value noise: hashed lattice values, smoothstep-blended.
function hash(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const plane = (zz: number) =>
    lerp(
      lerp(hash(xi, yi, zz), hash(xi + 1, yi, zz), u),
      lerp(hash(xi, yi + 1, zz), hash(xi + 1, yi + 1, zz), u),
      v,
    );
  return lerp(plane(zi), plane(zi + 1), w);
}

export function field(canvas: HTMLCanvasElement, still: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let w = 0, h = 0, cols = 0, rows = 0;
  let vals = new Float32Array(0);
  let mx = 0, my = 0, hx = 0, hy = 0, on = 0, lift = 0; // pointer, the hill easing after it, and its height
  let raf = 0, running = false, last = 0;
  const t0 = performance.now();

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / STEP) + 2;
    rows = Math.ceil(h / STEP) + 2;
    vals = new Float32Array(cols * rows);
  }

  function sample(now: number) {
    const z = (now - t0) * 0.000045;
    hx += (mx - hx) * 0.08;
    hy += (my - hy) * 0.08;
    lift += (on - lift) * 0.06; // the hill rises under the pointer and sinks when it leaves
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * STEP, y = j * STEP;
        let v = 0.65 * noise(x * 0.0032, y * 0.0032, z) + 0.35 * noise(x * 0.0071 + 40, y * 0.0071, z * 1.6);
        const d2 = (x - hx) ** 2 + (y - hy) ** 2;
        v += 0.32 * lift * Math.exp(-d2 / 26000);
        vals[j * cols + i] = v;
      }
    }
  }

  // One contour level through the grid, as line segments in one path.
  function contour(level: number) {
    ctx!.beginPath();
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = vals[j * cols + i], b = vals[j * cols + i + 1];
        const c = vals[(j + 1) * cols + i + 1], d = vals[(j + 1) * cols + i];
        const k = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        if (k === 0 || k === 15) continue;
        const x = i * STEP, y = j * STEP;
        const top = () => [x + STEP * ((level - a) / (b - a)), y] as const;
        const right = () => [x + STEP, y + STEP * ((level - b) / (c - b))] as const;
        const bottom = () => [x + STEP * ((level - d) / (c - d)), y + STEP] as const;
        const left = () => [x, y + STEP * ((level - a) / (d - a))] as const;
        const seg = (p: readonly [number, number], q: readonly [number, number]) => {
          ctx!.moveTo(p[0], p[1]);
          ctx!.lineTo(q[0], q[1]);
        };
        switch (k) {
          case 1: case 14: seg(left(), bottom()); break;
          case 2: case 13: seg(bottom(), right()); break;
          case 3: case 12: seg(left(), right()); break;
          case 4: case 11: seg(top(), right()); break;
          case 6: case 9: seg(top(), bottom()); break;
          case 7: case 8: seg(left(), top()); break;
          case 5: seg(left(), top()); seg(bottom(), right()); break;
          case 10: seg(top(), right()); seg(left(), bottom()); break;
        }
      }
    }
  }

  function draw(now: number) {
    sample(now);
    ctx!.clearRect(0, 0, w, h);
    // the map unfolds from the logo, near the top centre
    const t = now - t0;
    const reach = still ? 1e9 : t * 0.9;
    ctx!.save();
    if (reach < Math.hypot(w, h)) {
      ctx!.beginPath();
      ctx!.arc(w / 2, Math.min(h * 0.22, 190), reach, 0, Math.PI * 2);
      ctx!.clip();
    }
    ctx!.lineJoin = 'round';
    for (let n = 1; n <= LEVELS; n++) {
      const level = 0.12 + (n / (LEVELS + 1)) * 0.95;
      const index = n % 4 === 0;
      ctx!.strokeStyle = index ? `rgba(${LEAF},0.34)` : `rgba(${SAGE},0.13)`;
      ctx!.lineWidth = index ? 1.3 : 1;
      contour(level);
      ctx!.stroke();
    }
    ctx!.restore();
  }

  function loop(now: number) {
    if (now - last > 33) {
      draw(now);
      last = now;
    }
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  addEventListener('resize', () => { resize(); if (still) draw(performance.now()); });
  if (still) return draw(t0 + 1);
  const host = canvas.parentElement!;
  host.addEventListener('pointermove', (e) => {
    const b = canvas.getBoundingClientRect();
    mx = e.clientX - b.left;
    my = e.clientY - b.top;
    if (!on && lift < 0.02) { hx = mx; hy = my; }
    on = 1;
  });
  host.addEventListener('pointerleave', () => { on = 0; });
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
}
