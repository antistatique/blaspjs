import { performance } from 'node:perf_hooks';

// Build first: `npm run build`
import { Blasp } from '../dist/index.js';

function ms(n) {
  return `${n.toFixed(2)}ms`;
}

function timeOne(label, fn) {
  const t0 = performance.now();
  const out = fn();
  const t1 = performance.now();
  return { label, durationMs: t1 - t0, out };
}

const text = 'hello world';
const b = new Blasp();

const cases = [
  { label: 'default blasp.check(text) cold', fn: () => b.check(text) },
  { label: 'default blasp.check(text) warm', fn: () => b.check(text) },
  { label: "in('english','french').check(text) cold", fn: () => b.in('english', 'french').check(text) },
  { label: "in('english','french').check(text) warm", fn: () => b.in('english', 'french').check(text) },
];

for (const c of cases) {
  const r = timeOne(c.label, c.fn);
  // eslint-disable-next-line no-console
  console.log(`${r.label}: ${ms(r.durationMs)} (offensive=${r.out.isOffensive()})`);
}

