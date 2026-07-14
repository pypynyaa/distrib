import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('tmp-visual-audit');
fs.mkdirSync(outDir, {recursive: true});

async function cdpNewPage(url) {
  const res = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(url), {method: 'PUT'});
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const {resolve, reject} = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  };
  const send = (method, params = {}) => {
    const mid = ++id;
    ws.send(JSON.stringify({id: mid, method, params}));
    return new Promise((resolve, reject) => pending.set(mid, {resolve, reject}));
  };
  return {ws, send, target};
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function setMobile(page) {
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await page.send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
}

async function screenshot(page, name) {
  await wait(500);
  const result = await page.send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
  return file;
}

async function loginToken(email, password) {
  const res = await fetch('http://127.0.0.1:8000/auth/login', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({email, password}),
  });
  if (!res.ok) throw new Error(`login ${email}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function makeLoggedPage(kind) {
  const auth = kind === 'admin'
    ? await loginToken('owner@insomnia.market', 'admin')
    : await loginToken('artist@insomnia.market', 'insomnia');
  const page = await cdpNewPage('http://127.0.0.1:5173/');
  await setMobile(page);
  await page.send('Page.navigate', {url: 'http://127.0.0.1:5173/'});
  await wait(1000);
  const user = {
    id: auth.user.id,
    artist: auth.user.artist_name,
    role: auth.user.role,
    avatar_url: auth.user.avatar_url,
    bio: auth.user.bio,
    city: auth.user.city,
    country: auth.user.country,
    genres: auth.user.genres || [],
    social_links: auth.user.social_links || {},
  };
  await page.send('Runtime.evaluate', {
    expression: `localStorage.setItem('im_token', ${JSON.stringify(auth.token)}); localStorage.setItem('im_user', ${JSON.stringify(JSON.stringify(user))}); location.reload();`,
  });
  await wait(1500);
  return page;
}

async function clickText(page, text) {
  const expr = `(() => {
    const text = ${JSON.stringify(text)};
    const els = [...document.querySelectorAll('button,a')];
    const el = els.find(e => e.textContent.trim().includes(text));
    if (el) { el.click(); return true; }
    return els.map(e => e.textContent.trim()).slice(0, 30);
  })()`;
  const result = await page.send('Runtime.evaluate', {expression: expr, returnByValue: true});
  await wait(800);
  return result.result.value;
}

async function openMobileNav(page) {
  await page.send('Runtime.evaluate', {expression: `document.querySelector('header .mobile')?.click()`});
  await wait(500);
}

async function navTo(page, text) {
  await openMobileNav(page);
  return clickText(page, text);
}

const files = [];

const login = await cdpNewPage('http://127.0.0.1:5173/');
await setMobile(login);
await login.send('Page.navigate', {url: 'http://127.0.0.1:5173/'});
await wait(1200);
files.push(await screenshot(login, '01-login'));

const artist = await makeLoggedPage('artist');
files.push(await screenshot(artist, '02-artist-home'));
for (const [label, name] of [
  ['Релизы', '03-releases'],
  ['Загрузить релиз', '04-upload'],
  ['Финансы', '05-finance'],
  ['Промо', '06-promo'],
  ['Промо-ссылки', '07-links'],
  ['Поддержка', '08-support'],
  ['Профиль', '09-profile'],
]) {
  await navTo(artist, label);
  files.push(await screenshot(artist, name));
}

const admin = await makeLoggedPage('admin');
files.push(await screenshot(admin, '10-admin-home'));
for (const [label, name] of [
  ['Поддержка', '11-admin-support'],
  ['Новости', '12-admin-news'],
  ['Профиль', '13-admin-profile'],
]) {
  await navTo(admin, label);
  files.push(await screenshot(admin, name));
}

console.log(JSON.stringify(files, null, 2));
