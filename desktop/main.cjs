const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

app.setName('水位线');
// A fixed directory keeps saves shared between installer and portable editions.
app.setPath('userData', path.join(app.getPath('appData'), 'Shuiweixian'));
const gameURL = pathToFileURL(path.join(__dirname, '../web/index.html')).href;
let win;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
  });
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
    win = new BrowserWindow({
      width: 1280, height: 800, minWidth: 360, minHeight: 560,
      title: '水位线', backgroundColor: '#050809', show: false,
      icon: path.join(__dirname, '../assets/icon.ico'),
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true }
    });
    Menu.setApplicationMenu(null);
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', (event, url) => { if (url !== gameURL) event.preventDefault(); });
    win.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F11') { event.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
      if (input.type === 'keyDown' && input.key === 'Escape' && win.isFullScreen()) win.setFullScreen(false);
      if ((input.control || input.meta) && input.key.toLowerCase() === 'r') event.preventDefault();
    });
    let closing = false;
    win.on('close', event => {
      if (closing) return;
      event.preventDefault();
      const finish = () => { if (!closing) { closing = true; if (!win.isDestroyed()) win.close(); } };
      const timer = setTimeout(finish, 1500);
      win.webContents.executeJavaScript('window.swlNative?.pause()').catch(() => {}).finally(() => { clearTimeout(timer); finish(); });
    });
    win.on('minimize', () => win.webContents.executeJavaScript('window.swlNative?.pause()').catch(() => {}));
    win.on('restore', () => win.webContents.executeJavaScript('window.swlNative?.resume()').catch(() => {}));
    win.once('ready-to-show', () => win.show());
    win.loadURL(gameURL);
  });
  app.on('window-all-closed', () => app.quit());
}
