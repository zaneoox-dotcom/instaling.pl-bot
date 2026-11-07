import { mouse, keyboard, Point, Key } from '@nut-tree-fork/nut-js';
import { buildPersona } from './persona.js';

const P = buildPersona();

const sleep = ms => new Promise(r => setTimeout(r, ms));
const randn = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
const sampleLogn = ({ m, s }) => Math.exp(m + s * randn());
const minJerk = t => 10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5;
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y
  };
};

mouse.config.mouseSpeed = 0;
keyboard.config.autoDelayMs = 0;

export async function humanMove(to, from) {
  const p0 = from ?? await mouse.getPosition();
  const D = Math.hypot(to.x - p0.x, to.y - p0.y);
  if (D < 2) return;

  const T = Math.exp(P.fitts.a + P.fitts.b * Math.log(D) + P.fitts.resid * randn()); // ms
  const ux = (to.x - p0.x) / D, uy = (to.y - p0.y) / D;
  const nx = -uy, ny = ux;
  const k1 = (P.curve.m + P.curve.s * randn()) * D;
  const k2 = (P.curve.m + P.curve.s * randn()) * D * 0.6;
  const c1 = { x: p0.x + ux * D * 0.3 + nx * k1, y: p0.y + uy * D * 0.3 + ny * k1 };
  const c2 = { x: p0.x + ux * D * 0.7 + nx * k2, y: p0.y + uy * D * 0.7 + ny * k2 };

  // Sometimes overshoot, then correct
  const over = D > 300 && Math.random() < 0.3 && !from;
  const end = over
    ? { x: to.x + ux * (5 + Math.random() * 15), y: to.y + uy * (5 + Math.random() * 15) }
    : to;

  const start = performance.now();
  let tx = 0, ty = 0; // smoothed tremor
  while (true) {
    const t = Math.min(1, (performance.now() - start) / T);
    const p = bez(p0, c1, c2, end, minJerk(t));
    tx = tx * 0.9 + randn() * 0.25;
    ty = ty * 0.9 + randn() * 0.25;
    await mouse.setPosition(new Point(Math.round(p.x + tx), Math.round(p.y + ty)));
    if (t >= 1) break;
    await sleep(Math.min(30, sampleLogn(P.step)));
  }

  if (over) await humanMove(to, new Point(Math.round(end.x), Math.round(end.y)));
  else await mouse.setPosition(new Point(Math.round(to.x), Math.round(to.y)));
}

export const humanDelay = () => sleep(sampleLogn(P.click));

const rowsQ = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function neighbor(c) {
  const l = c.toLowerCase();
  for (let r = 0; r < 3; r++) {
    const i = rowsQ[r].indexOf(l);
    if (i < 0) continue;
    const opts = [rowsQ[r][i - 1], rowsQ[r][i + 1], rowsQ[r - 1]?.[i], rowsQ[r + 1]?.[i]].filter(Boolean);
    return opts[Math.floor(Math.random() * opts.length)];
  }
  return null;
}

// Deliberately wrong answer that stays uncorrected
export function corrupt(w) {
  if (w.length < 2) return w + 'x';
  const i = Math.floor(Math.random() * (w.length - 1));
  const ops = [
    () => w.slice(0, i) + w.slice(i + 1),
    () => w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2),
    () => w.slice(0, i) + (neighbor(w[i]) ?? 'x') + w.slice(i + 1)
  ];
  for (let k = 0; k < 6; k++) {
    const r = ops[Math.floor(Math.random() * 3)]();
    if (r && r !== w) return r;
  }
  return w + 'x';
}

// Types text with natural self-corrected typos from your recorded habits
export async function humanType(text) {
  const T = P.typo;
  const tap = async c => { await keyboard.type(c); await sleep(sampleLogn(P.key)); };
  for (let i = 0; i < text.length;) {
    const w = Math.random() < T.perChar ? neighbor(text[i]) : null;
    if (!w) { await tap(text[i]); i++; continue; }
    const extra = Math.min(T.runs[Math.floor(Math.random() * T.runs.length)] - 1, text.length - i - 1);
    await tap(w);
    for (let j = 1; j <= extra; j++) await tap(text[i + j]);
    await sleep(sampleLogn(T.notice));
    for (let j = 0; j <= extra; j++) { await keyboard.type(Key.Backspace); await sleep(sampleLogn(T.bs)); }
    await sleep(sampleLogn(T.recover));
    for (let j = 0; j <= extra; j++) await tap(text[i + j]);
    i += extra + 1;
  }
}

export async function humanClick(to) {
  await humanMove(to);
  await sleep(40 + Math.random() * 60);
  await mouse.leftClick();
  await humanDelay();
}