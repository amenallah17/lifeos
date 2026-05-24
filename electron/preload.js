const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Read storage file synchronously at preload time — before renderer starts
const userDataPath = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'LifeOS')
  : path.join(require('os').homedir(), '.config', 'LifeOS');
const storageFile = path.join(userDataPath, 'lifeos-localstorage.json');
let initialStorage = null;
try {
  if (fs.existsSync(storageFile)) {
    initialStorage = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
  }
} catch (e) {
  console.error('preload storage read error:', e);
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Synchronous — available immediately when renderer JS runs
  storageData: initialStorage,

  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbGet: (sql, params) => ipcRenderer.invoke('db-get', sql, params),

  storageLoad: () => ipcRenderer.invoke('storage-load'),
  storageSave: (data) => ipcRenderer.invoke('storage-save', data),

  onToggleCommandPalette: (callback) => {
    ipcRenderer.on('toggle-command-palette', callback);
    return () => ipcRenderer.removeListener('toggle-command-palette', callback);
  },
  onToggleQuickCapture: (callback) => {
    ipcRenderer.on('toggle-quick-capture', callback);
    return () => ipcRenderer.removeListener('toggle-quick-capture', callback);
  },

  downloadUpdate: () => ipcRenderer.invoke('update-download'),
  installUpdate: () => ipcRenderer.invoke('update-install'),
  onUpdateStatus: (callback) => {
    const handler = (_event, status, data, extra) => callback(status, data, extra);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  },
});
