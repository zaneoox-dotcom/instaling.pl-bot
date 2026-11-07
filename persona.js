import fs from 'fs';

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const logn = a => { const l = a.filter(x => x > 0).map(Math.log); return { m: mean(l), s: sd(l) }; };
const ln = (a, d) => (a.length >= 3 ? logn(a) : d);
const gaps = arr => arr.slice(1).map((e, i) => e.t - arr[i].t);
export function buildPersona(file = 'rec.json') {
  const { moves, clicks, keys } = JSON.parse(fs.readFileSync(file));
  // One stroke = previous click -> next click
  const rows = [];
  const stepGaps = [];
  for (let i = 1; i < clicks.length; i++) {
    const a = clicks[i - 1], b = clicks[i];
    const seg = moves.filter(m => m.t > a.t && m.t <= b.t);
    const k = seg.findIndex(m => Math.hypot(m.x - a.x, m.y - a.y) > 4);
    if (k < 0) continue;
    const s = seg.slice(k);
    const D = Math.hypot(b.x - a.x, b.y - a.y);
    if (s.length < 5 || D < 30) continue;
    for (let j = 1; j < s.length; j++) {
  const g = s[j].t - s[j - 1].t;
  if (g > 0 && g < 50) stepGaps.push(g);
}
    const ux = (b.x - a.x) / D, uy = (b.y - a.y) / D;
    let best = 0;
    for (const p of s) {
      const dev = (-(p.x - a.x) * uy + (p.y - a.y) * ux) / D;
      if (Math.abs(dev) > Math.abs(best)) best = dev;
    }
    rows.push({ D, T: b.t - s[0].t, curve: best });
  }
  if (rows.length < 15) throw new Error(`Only ${rows.length} usable strokes, record more`);

  const X = rows.map(r => Math.log(r.D)), Y = rows.map(r => Math.log(r.T));
  const mx = mean(X), my = mean(Y);
  const b = X.reduce((s, x, i) => s + (x - mx) * (Y[i] - my), 0) / X.reduce((s, x) => s + (x - mx) ** 2, 0);
  const a = my - b * mx;
  const resid = sd(Y.map((y, i) => y - (a + b * X[i])));

  // Typing: normal gaps, time to notice a typo, backspace gaps, recovery gaps, backspace run lengths
  const typeGaps = [], notice = [], bsGaps = [], recover = [], runs = [];
  let nKey = 0, run = 0;
  keys.forEach((k, i) => {
    const prev = keys[i - 1];
    const g = prev ? k.t - prev.t : Infinity;
    if (!k.bs) nKey++;
    if (g < 1500) {
      if (!k.bs && !prev.bs) typeGaps.push(g);
      else if (k.bs && !prev.bs) notice.push(g);
      else if (k.bs && prev.bs) bsGaps.push(g);
      else recover.push(g);
    }
    if (k.bs) run++;
    else if (run) { runs.push(run); run = 0; }
  });
  if (run) runs.push(run);

  const typo = runs.length >= 3 && notice.length >= 3
    ? {
        perChar: runs.length / nKey,
        runs,
        notice: logn(notice),
        bs: ln(bsGaps, { m: Math.log(120), s: 0.3 }),
        recover: ln(recover, { m: Math.log(250), s: 0.4 })
      }
    : { // fallback when no backspaces were recorded
        perChar: 0.03,
        runs: [1, 1, 1, 2, 3],
        notice: { m: Math.log(350), s: 0.4 },
        bs: { m: Math.log(120), s: 0.3 },
        recover: { m: Math.log(250), s: 0.4 }
      };

  return {
    fitts: { a, b, resid },
    curve: { m: mean(rows.map(r => r.curve)), s: sd(rows.map(r => r.curve)) },
    click: logn(gaps(clicks).filter(g => g < 5000)),
    key: logn(typeGaps),
    step: ln(stepGaps, { m: Math.log(8), s: 0.3 }),
    typo
  };
}