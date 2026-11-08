// A slow sheet of green silk, drawn by one fragment shader. Half resolution,
// paused while offscreen; with reduced motion it draws one frame and stops.
const frag = `precision mediump float;
uniform vec2 r; uniform float t;
void main() {
  vec2 p = (gl_FragCoord.xy * 2. - r) / min(r.x, r.y);
  for (float i = 1.; i < 6.; i++) {
    p.x += .32 / i * sin(i * 2.1 * p.y + t * .22 + i);
    p.y += .38 / i * cos(i * 1.6 * p.x + t * .18 + i * 1.3);
  }
  float v = .5 + .5 * sin(p.x * 1.3 + p.y * .9);
  float fold = .5 + .5 * sin(p.y * 3.1 - p.x * 1.7);
  vec3 c = vec3(.035, .035, .043);
  c = mix(c, vec3(.02, .17, .09), pow(v, 4.) * (.55 + .45 * fold));
  c += vec3(.30, .85, .55) * pow(v, 36.) * .32 * fold;
  gl_FragColor = vec4(c, 1.);
}`;

export function silk(canvas: HTMLCanvasElement, still: boolean) {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}'));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');

  const size = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth / 2));
    const h = Math.max(1, Math.round(canvas.clientHeight / 2));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  const draw = (ms: number) => {
    size();
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, 8 + ms / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  canvas.classList.add('on');
  if (still) {
    draw(0);
    addEventListener('resize', () => draw(0));
    return;
  }
  let raf = 0;
  const loop = (ms: number) => {
    draw(ms);
    raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf);
    if (e.isIntersecting) raf = requestAnimationFrame(loop);
  }).observe(canvas);
}
