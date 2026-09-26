// Checks that the site renders the demo data exactly as sprout printed it.
// Usage: node scripts/check-parity.ts <dir with m0.txt..m4.txt from the CLI>
import { readFileSync } from 'node:fs';
import { flatten, churnScale, label } from '../src/scripts/tree.ts';

const demo = JSON.parse(readFileSync(new URL('../src/data/demo.json', import.meta.url), 'utf8'));
const dir = process.argv[2];
const strip = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
let bad = 0;
demo.modes.forEach((m: any, i: number) => {
  const rows = flatten(m.tree);
  const scale = churnScale(rows);
  const got = [m.header, ...rows.map((r) => r.conn + strip(label(r.node, scale, m.size))), '', m.summary].join('\n');
  const want = readFileSync(`${dir}/m${i}.txt`, 'utf8').trimEnd();
  if (got !== want) {
    bad++;
    console.log('MISMATCH', m.id);
  }
});
console.log(bad ? 'FAIL' : `all ${demo.modes.length} views match sprout output exactly`);
process.exit(bad ? 1 : 0);
