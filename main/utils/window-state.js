'use strict'

const { fromEvent, merge } = require('rxjs')
const { debounceTime, map, mergeMap } = require('rxjs/operators')
const fs = require('fs-extra')
const { getStoragePath } = require('./files')
const { getLogger } = require('./logger')

const logger = getLogger('utils/window-state')

/**
 * Makes a function to save window state into `state-{id}.json` file, within Electron's storage folder.
 * @param {BrowserWindow} window - that will be saved
 * @returns {function} an asynchronous function that will take the state as single parameter (object) and save it
 * into the json file.
 */
function makeSaver({ id }) {
  const file = getStoragePath(`state-${id}.json`)
  return async state => {
    try {
      await fs.writeFile(file, JSON.stringify(state), 'utf8')
    } catch (err) {
      logger.warn({ err, state, file }, `failed to save state: ${err.message}`)
    }
  }
}

/**
 * Restores window state from `state-{id}.json` file.
 * @param {BrowserWindow} window - that will be restored
 */
function restore(window) {
  const file = getStoragePath(`state-${window.id}.json`)
  try {
    // synchronous read, to avoid flashing the window
    const state = JSON.parse(fs.readFileSync(file, 'utf8'))
    window.setBounds(state)
    if (state.isMaximized) {
      window.maximize()
    } else if (state.isMinimized) {
      window.minimize()
    } else {
      window.setFullScreen(state.isFullScreen)
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(
        { err, file },
        `failed to parse previous state: ${err.message}`
      )
    }
  }
}

/**
 * Makes an observable that listen to the window events and emits a state object store in file.
 * @param {BrowserWindow} window - that will be monitored
 * @returns {Observable} the observable monitoring and saving state
 */
function makePositionObservable(window) {
  return merge(
    fromEvent(window, 'minimize'),
    fromEvent(window, 'restore'),
    fromEvent(window, 'maximize'),
    fromEvent(window, 'unmaximize'),
    fromEvent(window, 'resize'),
    fromEvent(window, 'move')
  ).pipe(
    debounceTime(250),
    map(() => ({
      ...window.getBounds(),
      isMaximized: window.isMaximized(),
      isMinimized: window.isMinimized(),
      isFullScreen: window.isFullScreen()
    })),
    mergeMap(makeSaver(window))
  )
}

const subscriptions = new Map()

module.exports = {
  /**
   * Starts monitoring the state (minimized, maximized, position and fullscreen) of a given window.
   * Its state is persisted so it could be restored.
   * @param {BrowserWindow} window - to start monitoring
   */
  manageState(window) {
    restore(window)
    subscriptions.set(window.id, makePositionObservable(window).subscribe())
  },

  /**
   * Stops monitoring this window state.
   * @param {BrowserWindow} window - to stop monitoring
   */
  unmanageState(window) {
    const subscription = subscriptions.get(window.id)
    if (subscription) {
      subscription.unsubscribe()
    }
  },

  /**
   * Focus a given window, restoring it if it is minimized
   * @param {BrowserWindow} window - to be focused
   */
  focusOnNotification(window) {
    if (window.isMinimized()) {
      window.restore()
    }
    window.focus()
  }
}
