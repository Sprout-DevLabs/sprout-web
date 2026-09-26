// Renders sprout's --json tree exactly as the CLI prints it. The site's demo
// data is real sprout output, and a check in scripts/ keeps this in step.

export interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  path?: string;
  size?: number;
  status?: string;
  changes?: number;
  churn?: number;
  added?: number;
  deleted?: number;
  moreFiles?: number;
  children?: TreeNode[];
}

export interface Row {
  key: string;
  conn: string;
  node: TreeNode;
}

const BARS = '▁▂▃▄▅▆▇█';

export const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function flatten(root: TreeNode): Row[] {
  const rows: Row[] = [];
  const walk = (n: TreeNode, prefix: string) => {
    const kids = n.children ?? [];
    kids.forEach((c, i) => {
      const last = i === kids.length - 1;
      rows.push({ key: c.path ?? c.name, conn: prefix + (last ? '└── ' : '├── '), node: c });
      if (c.type === 'directory') walk(c, prefix + (last ? '    ' : '│   '));
    });
  };
  walk(root, '');
  return rows;
}

// Same as sprout's humanSize: du -h style, powers of 1024.
export function humanSize(n: number): string {
  if (n < 1024) return `${n}B`;
  let div = 1024;
  let exp = 0;
  for (let m = Math.floor(n / 1024); m >= 1024; m = Math.floor(m / 1024)) {
    div *= 1024;
    exp++;
  }
  return (n / div).toFixed(1).replace(/\.0$/, '') + 'KMGTPE'[exp];
}

export type ChurnScale = Record<TreeNode['type'], number>;

// Files are scaled against the busiest file, directories against the busiest
// directory, as in `sprout --churn`.
export function churnScale(rows: Row[]): ChurnScale {
  const s: ChurnScale = { file: 0, directory: 0 };
  for (const { node } of rows) s[node.type] = Math.max(s[node.type], node.churn ?? 0);
  return s;
}

export function label(n: TreeNode, scale: ChurnScale, sizes = false): string {
  const dir = n.type === 'directory';
  let h = dir
    ? `<span class="t-dir">${esc(n.name)}/</span>`
    : n.status === 'D'
      ? `<span class="t-del-name">${esc(n.name)}</span>`
      : esc(n.name);
  if (sizes && ((n.size ?? 0) > 0 || !dir)) h += `  <span class="t-size">${humanSize(n.size ?? 0)}</span>`;
  if (n.status) h += `  <span class="t-st t-st-${n.status === '?' ? 'u' : n.status}">${n.status}</span>`;
  if (n.changes) h += `  <span class="t-dim">(${n.changes} changed)</span>`;
  if ((n.added ?? 0) + (n.deleted ?? 0) > 0) {
    h += `  <span class="t-add">+${n.added ?? 0}</span> <span class="t-del">-${n.deleted ?? 0}</span>`;
  }
  if (n.churn) {
    const max = scale[n.type];
    const i = Math.floor((n.churn * 8 - 1) / max);
    const heat = n.churn * 3 > max * 2 ? 3 : n.churn * 3 > max ? 2 : 1;
    h += `  <span class="t-heat-${heat}">${BARS[i]} ${n.churn}</span>`;
  }
  return h;
}
