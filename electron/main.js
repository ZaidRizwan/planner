const {
  app, BrowserWindow, Tray, Menu, nativeImage,
  ipcMain, globalShortcut, shell, screen,
} = require('electron')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

let mainWindow = null
let widgetWindow = null
let tray = null
let widgetVisible = true

// ── Main window ──────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: getIconPath(),
    show: false,
    titleBarStyle: 'default',
  })

  mainWindow.loadURL(
    isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`
  )

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // hide to tray on close — don't quit
  mainWindow.on('close', e => {
    if (!app.isQuiting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
}

// ── Widget window ─────────────────────────────────────────────────────────────
function createWidgetWindow() {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.workAreaSize

  widgetWindow = new BrowserWindow({
    width: 320,
    height: 500,
    x: width - 340,
    y: height - 530,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 260,
    minHeight: 280,
    maxWidth: 440,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-widget.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  const widgetUrl = isDev
    ? 'http://localhost:5173/widget.html'
    : `file://${path.join(__dirname, '../dist/widget.html')}`

  widgetWindow.loadURL(widgetUrl)
  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show()
    widgetVisible = true
  })
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = getIconPath()
  let icon
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) icon = nativeImage.createEmpty()
    // Resize to tray size (16x16 on Windows)
    if (!icon.isEmpty()) icon = icon.resize({ width: 16, height: 16 })
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('Planner')
  rebuildTrayMenu()

  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}

function rebuildTrayMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: '◈ Open Planner',
      click: () => { mainWindow.show(); mainWindow.focus() },
    },
    {
      label: widgetVisible ? '🗂  Hide Widget' : '🗂  Show Widget',
      click: toggleWidget,
    },
    { type: 'separator' },
    {
      label: '⚡ Focus Mode',
      click: () => {
        mainWindow.show(); mainWindow.focus()
        mainWindow.webContents.send('open-focus')
      },
    },
    {
      label: '🌩️ Brain Dump',
      click: () => {
        mainWindow.show(); mainWindow.focus()
        mainWindow.webContents.send('open-brain-dump')
      },
    },
    { type: 'separator' },
    {
      label: '❌ Quit',
      click: () => {
        app.isQuiting = true
        app.quit()
      },
    },
  ])
  tray.setContextMenu(menu)
}

function toggleWidget() {
  if (widgetVisible) {
    widgetWindow.hide()
    widgetVisible = false
  } else {
    widgetWindow.show()
    widgetVisible = true
  }
  rebuildTrayMenu()
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
function setupIPC() {
  // Widget wants to close/hide itself
  ipcMain.on('widget-hide', () => {
    widgetWindow.hide()
    widgetVisible = false
    rebuildTrayMenu()
  })

  // Widget wants to open the main app
  ipcMain.on('widget-open-main', (_, page) => {
    mainWindow.show()
    mainWindow.focus()
    if (page) mainWindow.webContents.send('navigate-to', page)
  })

  // One window updated localStorage — notify the other
  ipcMain.on('data-changed', (event) => {
    const senderContents = event.sender
    // forward to the other window
    if (senderContents === mainWindow.webContents) {
      widgetWindow.webContents.send('data-changed')
    } else {
      mainWindow.webContents.send('data-changed')
    }
  })

  // Widget requests fresh data snapshot from main window
  ipcMain.handle('get-data', async () => {
    try {
      const raw = await mainWindow.webContents.executeJavaScript(
        'localStorage.getItem("planner_data")'
      )
      return raw
    } catch {
      return null
    }
  })

  // Widget writes data — update localStorage in main window so React picks it up
  ipcMain.handle('set-data', async (_, json) => {
    try {
      await mainWindow.webContents.executeJavaScript(
        `localStorage.setItem("planner_data", ${JSON.stringify(json)}); true`
      )
      // also update in widget window (same data)
      await widgetWindow.webContents.executeJavaScript(
        `localStorage.setItem("planner_data", ${JSON.stringify(json)}); true`
      )
      // tell React to re-read store
      mainWindow.webContents.send('data-changed')
      return true
    } catch {
      return false
    }
  })

  // Widget toggle from keyboard
  ipcMain.on('toggle-widget', toggleWidget)

  // App info
  ipcMain.handle('get-version', () => app.getVersion())
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIconPath() {
  if (isDev) {
    return path.join(__dirname, '../public/favicon.svg')
  }
  return path.join(__dirname, '../favicon.svg')
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow()
  createWidgetWindow()
  createTray()
  setupIPC()

  // Global shortcuts (work even when app is minimised)
  globalShortcut.register('CommandOrControl+Space', () => {
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('open-brain-dump')
  })

  globalShortcut.register('Alt+P', () => {
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  globalShortcut.register('Alt+W', toggleWidget)
})

app.on('window-all-closed', e => e.preventDefault()) // keep running in tray

app.on('before-quit', () => {
  app.isQuiting = true
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  mainWindow.show()
  mainWindow.focus()
})
