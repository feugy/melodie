'ust strict'

require('dotenv').config()
const { join } = require('path')
const electron = require('electron')
const shortcut = require('electron-localshortcut')
const fileLoader = require('./services/file-loader')
const listEngine = require('./services/list-engine')
const mediaManager = require('./services/media-manager')
const {
  getStoragePath,
  subscribeRemote,
  registerRenderer,
  getLogger
} = require('./utils')
const { settingsModel } = require('./models/settings')

const isDev = process.env.ROLLUP_WATCH
const { app, BrowserWindow, Menu } = electron
const publicFolder = join(__dirname, '..', 'public')
let unsubscribe

const logger = getLogger()

logger.info(
  { levelFile: process.env.LOG_LEVEL_FILE || '.levels', pid: process.pid },
  `starting... To change log levels, edit the level file and run \`kill -USR2 ${process.pid}\``
)

if (isDev) {
  logger.info('enabling reloading')
  // soft reset for renderer process changes
  require('electron-reload')(publicFolder)
  // hard reset for main process changes
  require('electron-reload')(__dirname, {
    electron: join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
    forceHardReset: true,
    awaitWriteFinish: true
  })
}

async function createWindow() {
  Menu.setApplicationMenu(null)

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    icon: `${join(publicFolder, 'icon-256x256.png')}`
  })

  if (isDev) {
    shortcut.register(win, ['F12', 'CmdOrCtrl+Shift+I'], () => {
      const { webContents } = win
      if (!webContents.isDevToolsOpened()) {
        webContents.openDevTools()
      } else {
        webContents.closeDevTools()
      }
    })
    shortcut.register(win, ['Ctrl+R', 'F5'], () => {
      win.webContents.reloadIgnoringCache()
    })
  }

  registerRenderer(win)
  await listEngine.init(getStoragePath('db.sqlite3'))

  unsubscribe = subscribeRemote({
    fileLoader,
    listEngine,
    mediaManager,
    ...electron
  })
  win.loadURL(`file://${join(publicFolder, 'index.html')}`)

  win.webContents.once('did-finish-load', async () => {
    const { folders } = await settingsModel.get()
    logger.debug(
      { folders },
      'browser window ready, comparing and watching folders'
    )
    await fileLoader.compare(folders)
    fileLoader.watch(folders)
  })
}

app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    unsubscribe()
  }
})

app.on('activate', () => {
  // macOS dock support
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
