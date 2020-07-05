'ust strict'
const { join } = require('path')
const { app, BrowserWindow } = require('electron')
const subscribeRemote = require('./utils/electron-remote')

const publicFolder = join(__dirname, '..', 'public')
let unsubscribe

if (process.env.ROLLUP_WATCH) {
  require('electron-reload')(publicFolder)
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  unsubscribe = subscribeRemote()
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
