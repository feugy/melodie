import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'
import { app, BrowserWindow, dialog, Menu } from 'electron'
import parseArgs from 'minimist'
import { bufferWhen, debounceTime, filter, ReplaySubject } from 'rxjs'

import descriptor from './package.json' assert { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

// initialize environment before importing any code depending on @melodie/core
process.env.LOG_LEVEL_FILE = join(app.getPath('logs'), '../.levels')
process.env.LOG_DESTINATION = join(app.getPath('logs'), 'logs.txt')
process.env.ARTWORK_DESTINATION = join(app.getPath('pictures'), 'melodie-media')

async function stopOnError(err) {
  console.log(err)
  await dialog.showErrorBox(
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
 * @param {string[]} argv - command line arguments
 */
export async function main(argv) {
  config()
  let dispose

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  const isDev = Boolean(devUrl)
  const publicFolder = join(__dirname, isDev ? '../../common/ui/dist' : 'out')
  // Because macOS use events for opened files, and even before the app is ready, we need to buffer them to open them at once
  const openFiles$ = new ReplaySubject()

  if (!isDev && !app.requestSingleInstanceLock()) {
    return app.quit()
  }
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
    app.on('open-file', (evt, entry) => {
      openFiles$.next(entry)
    })
  } else {
    // other OS will pass opened files/folders as arguments
    for (const entry of entries) {
      openFiles$.next(entry)
    }
  }

  const { utils } = await import('@melodie/core')
  const services = await import('./lib/services/index.js')
  const { configureExternalLinks, manageState, registerShortcut } =
    await import('./lib/utils/index.js')
  const logger = utils.getLogger()

  logger.info(
    {
      levelFile: process.env.LOG_LEVEL_FILE || '.levels',
      logFile: process.env.LOG_DESTINATION,
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

    function toggleDevTools(webContents) {
      if (!webContents.isDevToolsOpened()) {
        webContents.openDevTools()
      } else {
        webContents.closeDevTools()
      }
    }

    if (isDev) {
      const { webContents } = win
      registerShortcut(webContents, 'F12', toggleDevTools)
      registerShortcut(webContents, 'CmdOrCtrl+Shift+I', toggleDevTools)
      registerShortcut(webContents, 'F5', () =>
        win.webContents.reloadIgnoringCache()
      )
    }

    configureExternalLinks(win)

    const {
      close: stopServices,
      port: realPort,
      totp
    } = await services.start(publicFolder, win, descriptor, desiredPort)

    win.once('ready-to-show', () => win.show())
    const url = devUrl ?? `file://${join(publicFolder, 'index.html')}`
    await win.loadURL(`${url}?port=${realPort}&totpSecret=${totp.secret.hex}`)

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

  await app.whenReady()
  app.on('window-all-closed', () => {
    dispose?.()
    app.quit()
  })
  dispose = await createWindow()
}

if (process.argv[0].endsWith('dist/electron') || process.argv.length === 1) {
  main(process.argv)
}
