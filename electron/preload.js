const { contextBridge, ipcRenderer } = require('electron')

// Expose safe APIs to the React app renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Notify main process that localStorage data changed
  notifyDataChanged: () => ipcRenderer.send('data-changed'),

  // Listen for data changes from other windows (widget)
  onDataChanged: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('data-changed', handler)
    return () => ipcRenderer.removeListener('data-changed', handler)
  },

  // Listen for overlay open commands from tray/shortcuts
  onOpenBrainDump: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('open-brain-dump', handler)
    return () => ipcRenderer.removeListener('open-brain-dump', handler)
  },

  onOpenFocus: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('open-focus', handler)
    return () => ipcRenderer.removeListener('open-focus', handler)
  },

  onNavigateTo: (cb) => {
    const handler = (_, page) => cb(page)
    ipcRenderer.on('navigate-to', handler)
    return () => ipcRenderer.removeListener('navigate-to', handler)
  },

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Check if running in Electron
  isElectron: true,
})
