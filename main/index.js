'ust strict'

const { join } = require('path')
const electron = require('electron')
const subscribeRemote = require('./utils/electron-remote')
const tagReader = require('./services/tag-reader')
const fileLoader = require('./services/file-loader')
const searchEngine = require('./services/search-engine')
const listEngine = require('./services/list-engine')

const { app, BrowserWindow } = electron
const publicFolder = join(__dirname, '..', 'public')
let unsubscribe

if (process.env.ROLLUP_WATCH) {
  require('electron-reload')(publicFolder)
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // TODO defer?
  await searchEngine.init()
  await listEngine.init()

  unsubscribe = subscribeRemote({
    tagReader,
    fileLoader,
    searchEngine,
    listEngine,
    ...electron
  })
  win.loadURL(`file://${join(publicFolder, 'index.html')}`)
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
