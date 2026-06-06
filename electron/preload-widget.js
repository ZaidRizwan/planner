const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Get current data from main window's localStorage
  getData: () => ipcRenderer.invoke('get-data'),

  // Write updated data back (syncs to both windows)
  setData: (json) => ipcRenderer.invoke('set-data', json),

  // Hide the widget
  hide: () => ipcRenderer.send('widget-hide'),

  // Open main app, optionally on a specific page
  openMain: (page) => ipcRenderer.send('widget-open-main', page),

  // Listen for data changes from main window
  onDataChanged: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('data-changed', handler)
    return () => ipcRenderer.removeListener('data-changed', handler)
  },

  isElectron: true,
})
