const {app, BrowserWindow, Menu, protocol, session, shell, dialog} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {assetPath, externalUrl} = require('./policy.cjs');
const ORIGIN = 'daves-dollars://app/';
const root = path.join(__dirname, 'app');
const files = new Set(fs.readdirSync(root));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'";
app.setName('Daves Dollars');
app.setPath('userData', path.join(app.getPath('appData'), 'Daves Dollars'));
// Test runs may supply Electron's standard --user-data-dir switch; production never requires it.
const testProfile = app.commandLine.getSwitchValue('user-data-dir');
if (testProfile) app.setPath('userData', path.resolve(testProfile));
protocol.registerSchemesAsPrivileged([{scheme:'daves-dollars',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
let window;
function openExternal(url) { if (externalUrl(url)) shell.openExternal(url).catch(() => {}); }
function createWindow() {
  window = new BrowserWindow({width:1380,height:940,minWidth:640,minHeight:540,title:"Dave's Dollars",backgroundColor:'#edf8f3',icon:path.join(__dirname,'icon.ico'),show:false,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:false}});
  window.webContents.setWindowOpenHandler(({url}) => {openExternal(url);return {action:'deny'};});
  window.webContents.on('will-navigate', (event, url) => {if (!url.startsWith(ORIGIN)) {event.preventDefault();openExternal(url);}});
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.webContents.on('did-fail-load', (_event, code, description) => {
    if (code !== -3) dialog.showErrorBox("Dave's Dollars could not open", `${description}\nTry reopening the application.`);
  });
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => {window=null;});
  window.loadURL(ORIGIN);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {if(window){if(window.isMinimized())window.restore();window.focus();}});
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    // The application never fetches remote content; reference links use the system browser.
    session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']}, (_details,callback) => callback({cancel:true}));
    protocol.handle('daves-dollars', request => {
      const file = assetPath(request.url, root, files);
      if (!file || request.method !== 'GET') return new Response('Not found',{status:404});
      return new Response(fs.readFileSync(file), {headers:{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {label:'File',submenu:[{label:'Open saved-data folder',click:() => shell.openPath(app.getPath('userData'))},{type:'separator'},{role:'quit'}]},
      {label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
      {label:'View',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},
      {label:'Help',submenu:[{label:"About Dave's Dollars",click:() => dialog.showMessageBox(window,{type:'info',title:"Dave's Dollars",message:`Dave's Dollars ${app.getVersion()}`,detail:'Offline home, income, net worth and budget calculators.\n\nUse Save, load or compare to keep a named scenario. Saved scenarios stay in your Windows user profile; they do not sync with the website or travel inside the EXE. Research links require internet and open in your default browser.\n\nPlanning estimates only. Dave is an unaffiliated parody.'})}]}
    ]));
    createWindow();
    app.on('activate', () => {if(BrowserWindow.getAllWindows().length===0)createWindow();});
  });
  app.on('window-all-closed', () => app.quit());
}
