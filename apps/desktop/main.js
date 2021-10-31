'ust strict'

const { config } = require('dotenv')
const { dirname, join } = require('path')
const os = require('os')
const electron = require('electron')
const shortcut = require('electron-localshortcut')
const { autoUpdater } = require('electron-updater')
const { ReplaySubject } = require('rxjs')
const { bufferWhen, debounceTime, filter } = require('rxjs/operators')
const parseArgs = require('minimist')
const descriptor = require('./package')

// initialize environment before importing any code depending on @melodie/core
process.env.LOG_LEVEL_FILE = join(electron.app.getAppPath(), '.levels')
process.env.LOG_DESTINATION = join(electron.app.getPath('logs'), 'logs.txt')
process.env.ARTWORK_DESTINATION = join(
  electron.app.getPath('pictures'),
  'melodie-media'
)

const {
  utils: { getLogger }
} = require('@melodie/core')
const services = require('./lib/services')
const { configureExternalLinks, manageState } = require('./lib/utils')

async function stopOnError(err) {
  await electron.dialog.showErrorBox(
    'All our apologies...',
    `Please report this error on github (https://github.com/feugy/melodie/issues):

  ${err.message}

Thanks a million!
`
  )
  process.exit(-1)
}

/**
 * Configures and starts Mélodie!
 * @async
 * @param {array<string>} argv - command line arguments
 */
exports.main = async argv => {
  config()
  let dispose
  const { app, BrowserWindow, Menu } = electron
  const isDev = process.env.NODE_ENV === 'test'
  const publicFolder = join(dirname(require.resolve('@melodie/ui')), 'public')

  if (!isDev && !app.requestSingleInstanceLock()) {
    return app.quit()
  }

  const logger = getLogger()
  // Because macOS use events for opened files, and even before the app is ready, we need to buffer them to open them at once
  const openFiles$ = new ReplaySubject()

  if (os.platform() !== 'darwin' && !app.isPackaged) {
    // when packaged, argv does not include the usual "node" first parameter
    argv.shift()
  }
  const { port, _: entries } = parseArgs(argv, { alias: { p: 'port' } })
  // first is always the archive or folder
  entries.splice(0, 1)
  const desiredPort = parseInt(port, 10) || undefined

  if (os.platform() === 'darwin') {
    // on macOS, open files will be passed with events
    app.on('open-file', (evt, entry) => openFiles$.next(entry))
  } else {
    // other OS will pass opened files/folders as arguments
    for (const entry of entries) {
      openFiles$.next(entry)
    }
  }

  logger.info(
    {
      levelFile: process.env.LOG_LEVEL_FILE || '.levels',
      pid: process.pid,
      desiredPort,
      entries
    },
    `


-----------------------------------------------------------------------------------
starting... To change log levels, edit the level file and run \`kill -USR2 ${process.pid}\``
  )

  process.on('uncaughtException', error => {
    logger.error(error, 'Uncaught exception')
    stopOnError(error)
  })
  process.on('unhandledRejection', error => {
    logger.error(error, 'Unhandled promise rejection')
    stopOnError(error)
  })

  if (isDev) {
    logger.info('enabling reloading')
    const reloadOnChange = require('electron-reload')
    // soft reset for renderer process changes
    reloadOnChange(publicFolder)
    // hard reset for main process changes
    reloadOnChange([__dirname, dirname(require.resolve('@melodie/core'))], {
      electron: join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
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
      webPreferences: { sandbox: true },
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

    configureExternalLinks(win)

    const {
      close: stopServices,
      port: realPort,
      totp
    } = await services.start(publicFolder, win, descriptor, desiredPort)

    win.once('ready-to-show', () => win.show())
    await win.loadURL(
      `file://${join(publicFolder, 'index.html')}?port=${realPort}&totpSecret=${
        totp.secret.hex
      }`
    )
    const openSubscription = openFiles$
      .pipe(
        bufferWhen(() => openFiles$.pipe(debounceTime(200))),
        filter(entries => entries.length > 0)
      )
      .subscribe(fileEntries => {
        logger.info({ fileEntries }, `opening files`)
        services.playFiles(fileEntries)
      })

    app.on('second-instance', () => {
      if (win.isMinimized()) {
        win.restore()
      }
      win.focus()
    })

    return () => {
      stopServices()
      openSubscription.unsubscribe()
    }
  }

  app.once('window-all-closed', () => {
    dispose && dispose()
    app.quit()
  })

  await app.whenReady()
  dispose = await createWindow()

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
