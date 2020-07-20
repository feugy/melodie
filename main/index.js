'ust strict'

const { join } = require('path')
const electron = require('electron')
const tagReader = require('./services/tag-reader')
const fileLoader = require('./services/file-loader')
const listEngine = require('./services/list-engine')
const { getStoragePath, subscribeRemote, registerRenderer } = require('./utils')
const { settingsModel } = require('./models/settings')

const { app, BrowserWindow } = electron
const publicFolder = join(__dirname, '..', 'public')
let unsubscribe

if (process.env.ROLLUP_WATCH) {
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
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  registerRenderer(win)
  await listEngine.init(getStoragePath('db.sqlite3'))

  unsubscribe = subscribeRemote({
    tagReader,
    fileLoader,
    // searchEngine,
    listEngine,
    ...electron
  })
  win.loadURL(`file://${join(publicFolder, 'index.html')}`)

  win.webContents.once('did-finish-load', async () => {
    const { folders } = await settingsModel.get()
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
