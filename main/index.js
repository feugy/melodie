'ust strict'

const { config } = require('dotenv')
const { join } = require('path')
const { platform } = require('os')
const electron = require('electron')
const shortcut = require('electron-localshortcut')
const { autoUpdater } = require('electron-updater')
const { ReplaySubject } = require('rxjs')
const { bufferWhen, debounceTime, filter } = require('rxjs/operators')
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
const { version, name } = require('../package')

/**
 * Configures and starts Mélodie!
 * @async
 * @param {array<string>} argv - command line arguments
 */
exports.main = async argv => {
  config()
  const { app, BrowserWindow, Menu } = electron
  const isDev = process.env.ROLLUP_WATCH
  const publicFolder = join(__dirname, '..', 'public')

  if (!app.requestSingleInstanceLock()) {
    return app.quit()
  }

  const logger = getLogger()
  // Because macOS use events for opened files, and even before the app is ready, we need to buffer them to open them at once
  const openFiles$ = new ReplaySubject()

  if (platform() === 'darwin') {
    // on macOS, open files will be passed with events
    app.on('open-file', (evt, entry) => openFiles$.next(entry))
  } else {
    if (!app.isPackaged) {
      // when package, argv does not include the usual "node" first parameter
      argv.shift()
    }
    // other OS will pass opened files/folders as arguments
    for (const entry of argv.slice(1)) {
      openFiles$.next(entry)
    }
  }

  logger.info(
    {
      levelFile: process.env.LOG_LEVEL_FILE || '.levels',
      pid: process.pid
    },
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
      icon: `${join(publicFolder, 'icons', 'icon-512x512.png')}`,
      backgroundColor: '#2e3141',
      show: false
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

    const unsubscribeRemote = subscribeRemote({
      core: {
        focusWindow: () => focusOnNotification(win),
        getVersions: () => ({
          ...process.versions,
          [name]: version
        })
      },
      tracks,
      settings,
      playlists,
      media,
      ...electron
    })

    win.once('ready-to-show', () => win.show())
    await win.loadURL(`file://${join(publicFolder, 'index.html')}`)
    const openSubscription = openFiles$
      .pipe(
        bufferWhen(() => openFiles$.pipe(debounceTime(200))),
        filter(entries => entries.length > 0)
      )
      .subscribe(fileEntries => {
        logger.info({ fileEntries }, `opening files`)
        // add relevant files to track queue
        tracks.play(fileEntries)
      })

    app.on('second-instance', () => {
      if (win.isMinimized()) {
        win.restore()
      }
      win.focus()
    })

    return () => {
      unsubscribeRemote()
      openSubscription.unsubscribe()
    }
  }

  app.once('window-all-closed', () => {
    unsubscribe()
    app.quit()
  })

  await models.init(getStoragePath('db.sqlite3'))
  await settings.init()
  tracks.listen()

  await app.whenReady()
  const unsubscribe = await createWindow()

  // autoUpdater is using logger functions detached from their instance
  const updaterLogger = getLogger('updater')
  autoUpdater.logger = {
    info: updaterLogger.info.bind(updaterLogger),
    warn: updaterLogger.warn.bind(updaterLogger),
    error: updaterLogger.error.bind(updaterLogger),
    debug: updaterLogger.debug.bind(updaterLogger)
  }
  if (!process.env.PORTABLE_EXECUTABLE_DIR) {
    try {
      // https://github.com/electron-userland/electron-builder/issues/4046#issuecomment-670367840
      autoUpdater.on('update-downloaded', () => {
        if (process.env.DESKTOPINTEGRATION === 'AppImageLauncher') {
          process.env.APPIMAGE = process.env.ARGV0
        }
      })
      // portable app can not automatically update
      await autoUpdater.checkForUpdatesAndNotify()
    } catch (error) {
      updaterLogger.error(
        { error },
        `failed to run auto-updater: ${error.message}`
      )
    }
  }
}

if (require.main === module) {
  exports.main(process.argv)
}
