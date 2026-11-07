import readline from 'node:readline/promises';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';
import { Point } from '@nut-tree-fork/nut-js';
import { runCalibration } from './calibration.js';

dotenv.config();
process.on('exit', c => console.log('process exit code', c));
process.on('unhandledRejection', e => console.log('unhandled:', e));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => Math.floor(a + Math.random() * (b - a));
if (!fs.existsSync('rec.json')) {
  console.log('No rec.json found, starting calibration...');
  await runCalibration();
} else if ((await rl.question('Recalibrate? (y/n): ')).trim().toLowerCase() === 'y') {
  await runCalibration();
}
// player.js builds the persona on import, so load it only after rec.json exists
const { humanClick, humanType, humanDelay, corrupt } = await import('./player.js');
const KEY = process.env.GEMINI_API_KEY;
const WRONG_RATE = 0.1; // chance per word
const MAX_WRONG = 3;    // cap per session
const SEL = {
  word: '#question_translation',
  example: '#question_usage',
  input: '#answer',
  check: '#check button',
  next: '#next_word'
};
const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized', '--disable-notifications', '--disable-popup-blocking']
});
const page = await browser.newPage();

// Click a random point inside the element (30-70%), converted to screen coords
async function clickEl(selector) {
  const el = await page.waitForSelector(selector, { visible: true });
  const p = await el.evaluate((e, fx, fy) => {
    const r = e.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    return {
      x: (window.screenX + (window.outerWidth - window.innerWidth) / 2 + r.left + r.width * fx) * dpr,
      y: (window.screenY + (window.outerHeight - window.innerHeight) + r.top + r.height * fy) * dpr
    };
  }, 0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4);
  await humanClick(new Point(Math.round(p.x), Math.round(p.y)));
}

// Click the field, make sure it's focused, type, verify, fall back to Puppeteer if needed
async function typeInto(selector, text) {
  await page.bringToFront();
  await clickEl(selector);

  const focused = await page.evaluate(s => document.activeElement === document.querySelector(s), selector);
  if (!focused) {
    console.log('Click missed the input (likely dpr scaling), focusing via Puppeteer');
    await page.focus(selector);
  }

  await humanType(text);

  const val = await page.$eval(selector, e => e.value);
  if (val !== text) {
    console.log(`OS typing failed (field has "${val}"), falling back to Puppeteer typing`);
    await page.$eval(selector, e => (e.value = ''));
    await page.type(selector, text, { delay: rnd(90, 160) });
  }
}

const optional = (sel, ms = 5000) =>
  page.waitForSelector(sel, { visible: true, timeout: ms }).catch(() => null);

const saveCache = () => fs.writeFileSync('words.json', JSON.stringify(cache, null, 1));
const cache = fs.existsSync('words.json') ? JSON.parse(fs.readFileSync('words.json')) : {};

const MODELS = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || 'gemini-3.8-flash')
  .split(',').map(s => s.trim());

// thinking settings, tried in order until the API accepts one
const THINK = [
  { thinkingConfig: { thinkingLevel: 'minimal' } },
  { thinkingConfig: { thinkingBudget: 0 } },
  {}
];
let ti = 0;
async function askGemini(model, prompt) {
  for (;;) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, ...THINK[ti] }
      }),
      signal: AbortSignal.timeout(8000)
    });
    if (r.status === 400 && ti < THINK.length - 1) {
      ti++;
      console.log('Thinking setting rejected, trying next');
      continue;
    }
    if (!r.ok) throw new Error(`${model} ${r.status}`);
    const j = await r.json();
    const t = j.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('');
    if (!t) throw new Error(`${model} empty reply: ${JSON.stringify(j).slice(0, 200)}`);
    return t;
  }
}
async function translate(word, example, avoid = []) {
  const prompt =
    `Polish vocabulary exercise. The Polish hint is: ${word}\n` +
    `English sentence with blanks (each underscore run is one missing word, one underscore per letter): ${example}\n` +
    `The hint may be a phrasal verb or idiom; give the common English expression that fits the sentence naturally.\n` +
    (avoid.length ? `These answers were already marked WRONG for this exact prompt, so it is NOT any of: ${avoid.join(', ')}.\n` : '') +
    `Reply with ONLY the missing English words in order, separated by single spaces, ` +
    `lowercase, no punctuation. Word lengths must match the blanks.`;

  for (let round = 1; round <= 3; round++) {
    for (const m of MODELS) {
      try {
        const t = await askGemini(m, prompt);
        return t.trim().split('\n')[0].replace(/[.!?]+$/, '').toLowerCase();
      } catch (e) {
        console.log('Provider failed:', e.message);
      }
    }
    await sleep(1500 * round);
  }
  throw new Error('All models failed');
}
// never gives up: waits and retries until the AI answers
async function translateSafe(word, example, avoid) {
  for (let i = 1; ; i++) {
    try { return await translate(word, example, avoid); }
    catch (e) {
      const wait = Math.min(60000, 10000 * i);
      console.log(`AI failed (attempt ${i}). Retrying in ${wait / 1000}s...`);
      await sleep(wait);
    }
  }
}
let ya = false;
await page.goto('https://instaling.pl/teacher.php?page=login');
if (await optional('.fc-cta-consent')) await clickEl('.fc-cta-consent');
await sleep(rnd(500, 1500));
if (await optional('#log_email')) {
  await typeInto('#log_email', process.env.user);
  await humanDelay();
  await typeInto('#log_password', process.env.password);
  await sleep(rnd(500, 600));
  await clickEl('button[type="submit"]');
  await sleep(rnd(700, 900));
} else if (!ya) {
  while (true) {
    const answer = (await rl.question('You\'re already logged in, continue anyway? (y/n/a): ')).trim().toLowerCase();
    if (answer === 'y') break;
    if (answer === 'a') { ya = true; break; }
    if (answer === 'n') { await browser.close(); process.exit(0); }
  }
}
if (await optional('#streak-button-close')) await clickEl('#streak-button-close');
const session = await page.$('.btn-start-session');
if (session && await session.evaluate(el => el.getAttribute('href'))) {
  console.log('Session available!');
  await clickEl('.btn-start-session');
  for (const t of ['Rozpocznij sesję', 'Kontynuuj sesję']) {
    const sel = `button::-p-text(${t})`;
    if (await optional(sel, 4000)) { await clickEl(sel); break; }
  }

  let wrong = 0, first = true;
  const failed = {}; // prompt -> answers that were marked wrong
  while (true) {
    // wait for the next question, the "don't know" prompt, or the finish screen
    const state = await page.waitForFunction(() => {
      const vis = s => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; };
      if (vis('#return_mainpage')) return 'done';
      if (vis('#dont_know_new, .dont_know_new')) return 'dontknow';
      if (vis('#answer')) return 'question';
      return false;
    }, { timeout: first ? 15000 : 10000 }).then(h => h.jsonValue()).catch(() => null);
    first = false;

    if (state === 'done') { console.log('Session finished (return button visible).'); await clickEl('#return_mainpage'); await sleep(2000); await browser.close(); break; }

    if (state === 'dontknow') {
      console.log('New word prompt, skipping it.');
      await sleep(rnd(400, 900));
      await clickEl('#dont_know_new, .dont_know_new');
      if (await optional('#skip', 5000)) await clickEl('#skip');
      continue; // back to the top, the wait picks up whatever comes next
    }

    if (state !== 'question') { console.log('No question or finish screen found, stopping.'); break; }

    const word = await page.$eval(SEL.word, e => e.innerText.trim());
    const example = await page.$eval(SEL.example, e => {
      const c = e.cloneNode(true);
      c.querySelectorAll('.visually-hidden').forEach(n => n.remove());
      return c.innerText.trim();
    }).catch(() => '');
    console.log(`\nPL: ${word}\nSentence: ${example}`);

    console.time('ai');
    const ck = word + '|' + example;
    const pending = cache[ck] ? Promise.resolve(cache[ck]) : translateSafe(word, example, failed[ck] ?? []);
    await sleep(rnd(300, 700));
    let ans = await pending;
    console.timeEnd('ai');
    console.log(`AI: "${ans}"`);
    const intentional = wrong < MAX_WRONG && Math.random() < WRONG_RATE;
    if (intentional) {
      ans = corrupt(ans);
      wrong++;
      console.log(`Typing (intentional error): "${ans}"`);
    } else {
      console.log(`Typing: "${ans}"`);
    }
    await typeInto(SEL.input, ans);
    await sleep(rnd(100, 300));
    await clickEl(SEL.check);
    const res = await optional('#answer_result div', 10000);
    const ok = res ? await res.evaluate(e => e.classList.contains('green')) : false;
    if (ok) {
      if (!intentional && !cache[ck]) { cache[ck] = ans; saveCache(); }
    } else {
      const real = (await optional('#word', 3000)) // the site shows the correct answer in #word after a miss: learn it
      ? await page.$eval('#word', e => e.innerText.trim().toLowerCase())
      : '';
  if (real) {
    cache[ck] = real;
    saveCache();
    console.log(`Wrong${intentional ? ' (intentional)' : ''}. Correct answer saved: "${real}"`);
  } else if (!intentional) {
    (failed[ck] ??= []).push(ans);
    console.log(`Wrong: "${ans}", no correct answer found. Will retry with a hint when "${word}" returns.`);
  }
  }
  await humanDelay();
  await clickEl(SEL.next);
  }
  console.log(`Done. Intentional errors: ${wrong}`);
} else {
  console.log('Session unavailable.');
}
rl.close();