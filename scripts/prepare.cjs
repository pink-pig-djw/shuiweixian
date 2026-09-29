const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const file = path.join(root, 'web/index.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace('init,resume,setVol,vol,', "init,resume,setVol,vol,suspend(){if(C&&C.state==='running')C.suspend().catch(()=>{});},");
html = html.replace("if(C.state==='suspended')C.resume();", "if(C.state==='suspended')C.resume().catch(()=>{});");
html = html.replace(/\/\* NATIVE_LIFECYCLE_START \*\/[\s\S]*?\/\* NATIVE_LIFECYCLE_END \*\/\n?/, '');
const lifecycle = fs.readFileSync(path.join(root, 'web/native-lifecycle.js'), 'utf8');
html = html.replace('/* ---------------- boot ---------------- */', `/* NATIVE_LIFECYCLE_START */\n${lifecycle}\ninstallNativeLifecycle();\n/* NATIVE_LIFECYCLE_END */\n/* ---------------- boot ---------------- */`);
// All resources are already bundled inside the native applications.
html = html.replace(/<script>\s*if\('serviceWorker' in navigator[\s\S]*?<\/script>/, '');
fs.writeFileSync(file, html);
console.log('Native lifecycle adapter integrated.');
