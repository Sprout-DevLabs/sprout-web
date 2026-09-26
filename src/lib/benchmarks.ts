// The benchmark log: every run lives in src/data/benchmarks/history.json,
// and this module types and validates it. Adding a run means adding data;
// the page renders whatever is there. Validation runs at build time, so a
// mistyped number or a mislabelled claim fails the build instead of
// shipping.

import raw from '../data/benchmarks/history.json';

export type Kind = 'speed' | 'memory' | 'allocation' | 'complexity' | 'correctness';
export type Verdict = 'improved' | 'no-consistent-change' | 'changed';

export interface Metric {
  id: string;
  kind: Kind;
  verdict: Verdict;
  label: string;
  command: string;
  repository: string;
  before: number;
  after: number;
  unit: string;
  change?: number; // percent: median per-round change when rounds are given, else from before/after
  rounds?: [number, number]; // min/max per-round change, percent
  display?: { before: string; after: string };
  note?: string;
}

export interface Phase {
  id: string;
  number: number;
  name: string;
  from: string;
  to: string;
  commit: string;
  pr: number;
  results: { metric: string }[];
}

export interface Bottleneck {
  title: string;
  profile: string;
  shares: { label: string; value: number }[];
  unit: string;
  total?: number;
  note?: string;
}

export interface Run {
  id: string;
  date: string;
  title: string;
  phases: string[];
  baseline: { revision: string; label: string };
  current: { revision: string; label: string };
  environment: { hardware: string; cores: number; memory: string; os: string; go: string; cache: string; rounds: number };
  repositories: { name: string; revision: string; files: number; role: string }[];
  headline: string[];
  metrics: Metric[];
  notes: string[];
  bottlenecks: Bottleneck[];
  next: string[];
  methodology: string[];
  limitations: string[];
}

export const KINDS: Record<Kind, { label: string; blurb: string }> = {
  speed: { label: 'Speed', blurb: 'Wall time, counted only when faster in every interleaved round' },
  memory: { label: 'Memory', blurb: 'Peak RSS and live heap' },
  allocation: { label: 'Allocations', blurb: 'Bytes and objects allocated per run' },
  complexity: { label: 'Complexity', blurb: 'Asymptotic change in a data structure, not an end-to-end speedup' },
  correctness: { label: 'Correctness', blurb: 'What Sprout finds, not how fast' },
};

const history = raw as { phases: Phase[]; runs: Run[] };

function validate() {
  const problems: string[] = [];
  const kinds = new Set(Object.keys(KINDS));
  for (const run of history.runs) {
    const ids = new Set(run.metrics.map((m) => m.id));
    for (const m of run.metrics) {
      const where = `${run.id}/${m.id}`;
      if (!kinds.has(m.kind)) problems.push(`${where}: unknown kind ${m.kind}`);
      if (m.verdict === 'improved') {
        if (m.change === undefined) problems.push(`${where}: improved metrics need a measured change`);
        else if (m.rounds) {
          // Paired, per-round statistic: every round must agree in direction,
          // and the reported median must lie inside the per-round range.
          if (Math.sign(m.rounds[0]) !== Math.sign(m.rounds[1])) {
            problems.push(`${where}: "improved" but rounds ${m.rounds.join('…')} don't agree in direction`);
          }
          if (m.change < m.rounds[0] - 0.5 || m.change > m.rounds[1] + 0.5) {
            problems.push(`${where}: change ${m.change}% is outside its per-round range ${m.rounds.join('…')}`);
          }
        } else {
          // Deterministic counts: the change must follow from before and after.
          const computed = ((m.after - m.before) / m.before) * 100;
          if (Math.abs(computed - m.change) > 1.5) {
            problems.push(`${where}: change ${m.change}% doesn't match ${m.before} → ${m.after} (${computed.toFixed(1)}%)`);
          }
        }
      }
      if (m.verdict === 'no-consistent-change') {
        if (m.change !== undefined) problems.push(`${where}: no-consistent-change metrics must not carry a percentage`);
        if (!m.rounds || !(m.rounds[0] <= 0 && m.rounds[1] >= 0)) {
          problems.push(`${where}: "no consistent change" needs round ranges that span zero`);
        }
      }
    }
    for (const id of run.headline) if (!ids.has(id)) problems.push(`${run.id}: headline metric ${id} not found`);
  }
  const current = history.runs[0];
  for (const phase of history.phases) {
    for (const r of phase.results) {
      if (!current.metrics.some((m) => m.id === r.metric)) problems.push(`phase ${phase.id}: metric ${r.metric} not in the current run`);
    }
  }
  if (problems.length) throw new Error(`Invalid benchmark history:\n  ${problems.join('\n  ')}`);
}
validate();

/** Runs, newest first. */
export const runs: Run[] = [...history.runs].sort((a, b) => b.date.localeCompare(a.date));
export const current: Run = runs[0];
export const phases: Phase[] = history.phases;

export const metric = (run: Run, id: string): Metric => {
  const m = run.metrics.find((x) => x.id === id);
  if (!m) throw new Error(`metric ${id} not in run ${run.id}`);
  return m;
};

const nf = (v: number, digits: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Decimals follow the unit: "2.13 s", "1,128 MB", "88.3 MB", "460 B", "4.03", "2.52 M", "294 ms". */
export function fmt(m: Metric, side: 'before' | 'after'): string {
  if (m.display) return m.display[side];
  const v = m[side];
  const decimals: Record<string, number> = { s: 2, M: 2, '': 2, B: 0, ms: 0, edges: 0, ns: 1 };
  const d = m.unit === 'MB' ? (v >= 100 ? 0 : 1) : (decimals[m.unit] ?? 2);
  const n = nf(v, d);
  return m.unit ? `${n} ${m.unit}` : n;
}

/** "−39%" for improvements; verdict text otherwise. */
export function changeText(m: Metric): string {
  if (m.verdict === 'no-consistent-change') return 'No consistent change';
  if (m.change === undefined) return m.kind === 'complexity' ? 'O(N) → O(1)' : 'Changed';
  return `${m.change < 0 ? '−' : '+'}${Math.round(Math.abs(m.change))}%`;
}

export function roundsText(m: Metric): string {
  if (!m.rounds) return '';
  const p = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x)}%`;
  return `each round ${p(m.rounds[0])} to ${p(m.rounds[1])}`;
}

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export const commitUrl = (rev: string) => `https://github.com/Sprout-DevLabs/sprout/commit/${rev}`;
export const prUrl = (n: number) => `https://github.com/Sprout-DevLabs/sprout/pull/${n}`;
