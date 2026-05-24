const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const { initDatabase } = require('./database');

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const STORAGE_FILE = path.join(app.getPath('userData'), 'lifeos-localstorage.json');
const LOG_FILE = path.join(app.getPath('userData'), 'lifeos-error.log');
const FIXED_PORT = 18765;

function logError(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(' ')}`;
  try { fs.appendFileSync(LOG_FILE, msg + '\n'); } catch {}
  console.error(msg);
}

let mainWindow;
let db;
let server;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

function createStaticServer(baseDir) {
  return http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath !== '/' && urlPath.endsWith('/')) urlPath = urlPath.slice(0, -1);
    let filePath = path.join(baseDir, urlPath === '/' ? 'index.html' : urlPath);
    if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');

    fs.readFile(filePath, (err, data) => {
      if (err) {
        const nextIdx = urlPath.indexOf('_next/');
        if (nextIdx > 0) {
          const rootPath = urlPath.substring(nextIdx);
          const rootFilePath = path.join(baseDir, rootPath);
          fs.readFile(rootFilePath, (err2, data2) => {
            if (err2) {
              const ext = path.extname(rootFilePath).toLowerCase();
              if (MIME_TYPES[ext]) {
                res.writeHead(404);
                res.end('Not found');
              } else {
                serveFallback(res, baseDir);
              }
              return;
            }
            const ext = path.extname(rootFilePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            res.end(data2);
          });
          return;
        }

        const reqExt = path.extname(urlPath).toLowerCase();
        if (reqExt && MIME_TYPES[reqExt]) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          serveFallback(res, baseDir);
        }
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

function serveFallback(res, baseDir) {
  fs.readFile(path.join(baseDir, 'index.html'), (err2, data2) => {
    if (err2) {
      res.writeHead(500);
      res.end('500');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data2);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    resizable: true,
    frame: true,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    show: true,
  });

  const isDev = !app.isPackaged;
  console.log('isDev:', isDev, '| __dirname:', __dirname);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const staticDir = path.join(__dirname, '..', 'out');
    server = createStaticServer(staticDir);
    server.listen(FIXED_PORT, '127.0.0.1', () => {
      console.log('Server on http://127.0.0.1:' + FIXED_PORT);
      mainWindow.loadURL('http://127.0.0.1:' + FIXED_PORT);
    });
    server.on('error', () => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        console.log('Server on http://127.0.0.1:' + port);
        mainWindow.loadURL('http://127.0.0.1:' + port);
      });
    });
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    logError('Failed to load:', errorDescription, '(code:' + errorCode + ')', 'URL:', validatedURL);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const prefix = level === 2 ? '[renderer:error]' : '[renderer]';
    logError(prefix, message);
  });

  mainWindow.once('ready-to-show', () => {
    console.log('ready-to-show fired');
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
}

app.whenReady().then(async () => {
  try {
    db = await initDatabase();
    console.log('Database ready');
  } catch (err) {
    logError('DB init failed:', err.message);
  }

  await createWindow();
  globalShortcut.register('CommandOrControl+K', () => {
    mainWindow?.webContents.send('toggle-command-palette');
  });
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    mainWindow?.webContents.send('toggle-quick-capture');
  });
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', 'checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-status', 'available', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-status', 'uptodate');
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-status', 'downloading', null, progress.percent);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-status', 'downloaded');
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-status', 'error', err.message);
  });
});

ipcMain.handle('update-download', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('update-install', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (server) server.close();
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ─── Persistent localStorage via file (redundant safety net) ───
function loadStorage() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
    }
  } catch (e) { console.error('loadStorage error:', e); }
  return null;
}

function saveStorage(data) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data), 'utf-8');
  } catch (e) { console.error('saveStorage error:', e); }
}

ipcMain.handle('storage-load', () => {
  return loadStorage();
});

ipcMain.handle('storage-save', (_event, data) => {
  saveStorage(data);
});

ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window-close', () => mainWindow?.close());

ipcMain.handle('db-query', (_event, sql, params = []) => {
  if (!db || !db.isReady()) return JSON.stringify({ error: 'Database not ready', rows: [] });
  try {
    const stmt = db.prepare(sql);
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
      return JSON.stringify(stmt.all(...params));
    } else {
      const result = stmt.run(...params);
      return JSON.stringify({ changes: result.changes, lastInsertRowid: result.lastInsertRowid });
    }
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
});

ipcMain.handle('db-get', (_event, sql, params = []) => {
  if (!db || !db.isReady()) return JSON.stringify(null);
  try {
    const stmt = db.prepare(sql);
    const result = stmt.get(...params);
    return JSON.stringify(result || null);
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
});
