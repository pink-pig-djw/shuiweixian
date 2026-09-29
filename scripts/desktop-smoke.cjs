// Native Electron integration test; uses an isolated profile and never touches player saves.
const { app, BrowserWindow, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-results');
fs.mkdirSync(out, {recursive:true});
app.setPath('userData', fs.mkdtempSync(path.join(out, 'profile-')));
const errors = [];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let win;
async function evaluate(source) {
  try { return await win.webContents.executeJavaScript(source); }
  catch (error) { console.error('Renderer evaluation failed:', source, errors); throw error; }
}
async function until(source) {
  for (let n = 0; n < 100; n++) { if (await evaluate(source)) return; await wait(100); }
  throw Error('Timed out: ' + source);
}
async function open(width = 1280, height = 800) {
  win = new BrowserWindow({width, height, show:false, webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,offscreen:true,backgroundThrottling:false}});
  win.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  await win.loadFile(path.join(root, 'web/index.html'));
  await until("document.querySelector('#loading').classList.contains('off')");
  await evaluate("document.querySelector('#warn').click()");
  await wait(900);
}
app.whenReady().then(async () => {
  try {
    session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']}, (_d, callback) => callback({cancel:true}));
    await open();
    assert.equal(await evaluate('typeof require'), 'undefined');
    assert.ok(await evaluate("[...document.querySelectorAll('#tmenu button')].some(b => b.innerText === '开始')"));
    fs.writeFileSync(path.join(out, 'desktop-title.png'), (await win.webContents.capturePage()).toPNG());
    await evaluate("[...document.querySelectorAll('#tmenu button')].find(b=>b.innerText==='开始').click()");
    await wait(700);
    await evaluate('window.__swl.closeCard()');
    await wait(900);
    assert.equal(await evaluate('window.__swl.state().inGame'), true);
    await evaluate('window.swlNative.pause()');
    const snapshot = await evaluate("JSON.parse(localStorage.getItem('swl2_s0'))");
    assert.ok(snapshot && JSON.parse(snapshot.s).node);
    assert.equal(await evaluate('window.swlNative.back()'), true);
    assert.equal(await evaluate("document.querySelector('#modal').classList.contains('off')"), false);
    await evaluate('window.swlNative.back()');
    fs.writeFileSync(path.join(out, 'desktop-game.png'), (await win.webContents.capturePage()).toPNG());
    await win.webContents.session.flushStorageData();
    win.destroy();
    await open(390, 844);
    assert.ok(await evaluate("[...document.querySelectorAll('#tmenu button')].some(b => b.innerText.startsWith('继续'))"));
    await evaluate("[...document.querySelectorAll('#tmenu button')].find(b=>b.innerText.startsWith('继续')).click()");
    await wait(500);
    assert.equal(await evaluate('window.__swl.state().inGame'), true);
    await evaluate("document.querySelector('#bMenu').click()");
    await evaluate("document.querySelector('#mBody button[data-k=settings]').click()");
    assert.equal(await evaluate("document.querySelector('#modal').classList.contains('off')"), false);
    await wait(800);
    fs.writeFileSync(path.join(out, 'mobile-settings.png'), (await win.webContents.capturePage()).toPNG());
    await evaluate('window.swlNative.back()');
    await wait(800);
    fs.writeFileSync(path.join(out, 'mobile-game.png'), (await win.webContents.capturePage()).toPNG());
    assert.deepEqual(errors, []);
    console.log('PASS: offline boot, sandbox, start, save, reopen, continue, back, mobile settings; no console errors.');
    app.exit(0);
  } catch (error) { console.error(error); app.exit(1); }
});
app.on('window-all-closed', () => {});
