const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8');
test('all inline game scripts parse', () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0);
  for (const [, code] of scripts) new vm.Script(code);
});
test('all local fonts and manifest icons exist', () => {
  const css = fs.readFileSync(path.join(root, 'web/fonts/fonts.css'), 'utf8');
  const fonts = [...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m => m[1]);
  assert.ok(fonts.length > 0);
  for (const font of fonts) assert.ok(fs.existsSync(path.join(root, 'web/fonts', font)), font);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'web/manifest.webmanifest')));
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, 'web', icon.src)), icon.src);
});
test('lifecycle saves before audio suspension and stops autoplay', () => {
  const calls = [];
  const classes = { '#warn': ['off'], '#confirm': [], '#cgview': [] };
  const context = {
    window: { addEventListener() {} }, document: { addEventListener() {}, hidden: false },
    setAuto: x => calls.push(['auto', x]), setSkip: x => calls.push(['skip', x]),
    autoSave: () => calls.push('save'), saveP: x => calls.push(['profile', x]),
    AU: { suspend: () => calls.push('suspend'), resume: () => calls.push('resume') },
    $: selector => ({ classList: { contains: c => (classes[selector] || []).includes(c), remove: c => { classes[selector] = classes[selector].filter(x => x !== c); } } }),
    isModal: () => false, closeModal() {}, hidden: false, setHidden() {}, inGame: false, cardOpen: false, openModal: x => calls.push(['modal', x])
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'web/native-lifecycle.js'), 'utf8') + '\ninstallNativeLifecycle();', context);
  context.window.swlNative.pause();
  assert.deepEqual(calls, [['auto', false], ['skip', false], 'save', ['profile', true], 'suspend']);
  context.window.swlNative.resume(); assert.equal(calls.at(-1), 'resume');
  assert.equal(context.window.swlNative.back(), false);
  context.inGame = true; assert.equal(context.window.swlNative.back(), true); assert.deepEqual(calls.at(-1), ['modal', 'menu']);
  classes['#confirm'] = ['on']; context.window.swlNative.back(); assert.deepEqual(classes['#confirm'], []);
});
