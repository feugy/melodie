'ust strict'

const { config } = require('dotenv')
const { join } = require('path')
const electron = require('electron')
const shortcut = require('electron-localshortcut')
const { autoUpdater } = require('electron-updater')
const models = require('./models')
const { tracks, media, settings, playlists } = require('./services')
const {
  getLogger,
  getStoragePath,
  manageState,
  registerRenderer,
  focusOnNotification,
  configureExternalLinks,
  subscribeRemote
} = require('./utils')
const { version, name, dependencies } = require('../package-lock')

exports.main = async () => {
  config()
  const { app, BrowserWindow, Menu } = electron
  const isDev = process.env.ROLLUP_WATCH
  const publicFolder = join(__dirname, '..', 'public')
  let unsubscribe

  const logger = getLogger()

  logger.info(
    { levelFile: process.env.LOG_LEVEL_FILE || '.levels', pid: process.pid },
    `starting... To change log levels, edit the level file and run \`kill -USR2 ${process.pid}\``
  )

  process.on('uncaughtException', error => {
    logger.error(error, 'Uncaught exception')
  })
  process.on('unhandledRejection', error => {
    logger.error(error, 'Unhandled promise rejection')
  })

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
      width: 1500,
      minWidth: 1410,
      height: 800,
      minHeight: 300,
      webPreferences: {
        nodeIntegration: true
      },
      icon: `${join(publicFolder, 'icon-256x256.png')}`
    })
    manageState(win)

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
    configureExternalLinks(win)

    unsubscribe = subscribeRemote({
      core: {
        focusWindow: () => focusOnNotification(win),
        getVersions: () => ({
          ...process.versions,
          [name]: version,
          rxjs: dependencies.rxjs.version,
          tailwindcss: dependencies.tailwindcss.version
        })
      },
      tracks,
      settings,
      playlists,
      media,
      ...electron
    })
    win.loadURL(`file://${join(publicFolder, 'index.html')}`)
  }

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

  await app.whenReady()
  await createWindow()

  await models.init(getStoragePath('db.sqlite3'))
  settings.init()
  autoUpdater.logger = getLogger('updater')
  autoUpdater.checkForUpdatesAndNotify()
}

if (require.main === module) {
  exports.main()
}
