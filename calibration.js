//i used ai for this part :O
import puppeteer from 'puppeteer';
import fs from 'fs';

export async function runCalibration() {
  const data = { moves: [], clicks: [], keys: [] };
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--kiosk'] });
  const [page] = await browser.pages();
  let done;
  const finished = new Promise(r => (done = r));

  await page.exposeFunction('rec', (k, e) => data[k].push(e));
  await page.exposeFunction('finish', async () => {
    fs.writeFileSync('rec.json', JSON.stringify(data));
    await browser.close();
    done();
  });
await page.setContent(`
<body style="margin:0;background:#111;color:#eee;font:24px sans-serif;overflow:hidden;cursor:crosshair">

<div id="intro" style="position:fixed;inset:0;background:#111;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 10%">
  <div style="font-size:72px;font-weight:800;color:#4af;letter-spacing:2px">CALIBRATION</div>
  <div style="font-size:34px;margin-top:28px;line-height:1.4;max-width:1100px">
    This runs <b>once</b>. It records how you move the mouse and how fast you click and type,
    so the bot can imitate a human as closely as possible.
  </div>
  <div style="font-size:26px;margin-top:28px;color:#aaa;line-height:1.5">
    1. Click 80 dots &nbsp;&bull;&nbsp; 2. Type 8 short sentences<br>
    Use your normal mouse and posture. Don't rush, don't be slow. Takes about 3 minutes.<br>
    <br>Type naturally: if you make a typo, fix it with Backspace like you normally would. Don't aim for perfect.
    Press Esc anytime to quit, keep in mind u have to finish it fully for the program to work properly so please finish it.
  </div>
  <button id="go" style="margin-top:48px;font-size:34px;padding:16px 64px;border:0;border-radius:12px;background:#4af;color:#111;font-weight:700;cursor:pointer">START</button>
</div>

<div id="msg" style="position:fixed;top:12px;left:0;right:0;text-align:center"></div>
<div id="dot" style="position:fixed;border-radius:50%;background:#4af;display:none"></div>
<input id="inp" style="position:fixed;top:50%;left:20%;width:60%;font:28px sans-serif;display:none" autocomplete="off">

<script>
const N = 80, SENT = [
  'The quick brown fox jumps over the lazy dog',
  'Pack my box with five dozen liquor jugs',
  'How vexingly quick daft zebras jump',
  'Sphinx of black quartz, judge my vow',
  'Wczoraj wieczorem zjadlem pyszna kolacje',
  'Jutro rano ide na dlugi spacer z psem',
  'Nie wiem co mam teraz napisac w tym zdaniu',
  'To jest ostatnie zdanie do przepisania'
];
const $ = id => document.getElementById(id), t = () => performance.now();

addEventListener('mousemove', e => rec('moves', {t: t(), x: e.screenX, y: e.screenY}), true);
addEventListener('mousedown', e => rec('clicks', {t: t(), x: e.screenX, y: e.screenY}), true);
addEventListener('keydown', e => {
  if (e.key === 'Escape') finish();
  else if (e.key !== 'Enter') rec('keys', {t: t(), bs: e.key === 'Backspace'});
}, true);

let n = 0;
function nextDot() {
  if (n++ >= N) return typing();
  const s = 24 + Math.random() * 60, d = $('dot');
  d.style.display = 'block';
  d.style.width = d.style.height = s + 'px';
  d.style.left = Math.random() * (innerWidth - s) + 'px';
  d.style.top = 60 + Math.random() * (innerHeight - s - 60) + 'px';
  $('msg').textContent = 'Click the dot (' + n + '/' + N + ')  -  Esc to finish early';
}
$('dot').addEventListener('mousedown', nextDot);

let si = 0;
function typing() {
  $('dot').style.display = 'none';
  const i = $('inp'); i.style.display = 'block'; i.focus();
  i.onkeydown = e => { if (e.key === 'Enter') { i.value = ''; show(); } };
  show();
}
function show() {
  if (si >= SENT.length) return finish();
  $('msg').textContent = 'Type, then Enter (' + (si + 1) + '/' + SENT.length + '):  ' + SENT[si++];
}

$('go').addEventListener('click', () => {
  $('intro').style.display = 'none';
  nextDot();
});
</script>
</body>`);   await finished;}