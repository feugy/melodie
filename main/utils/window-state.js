'use strict'

const { fromEvent, merge } = require('rxjs')
const { debounceTime, map, mergeMap } = require('rxjs/operators')
const fs = require('fs-extra')
const { getStoragePath } = require('./files')
const { getLogger } = require('./logger')

const logger = getLogger('utils/window-state')

function save({ id }) {
  const file = getStoragePath(`state-${id}.json`)
  return async state => {
    try {
      await fs.writeFile(file, JSON.stringify(state), 'utf8')
    } catch (err) {
      logger.warn({ err, state, file }, `failed to save state: ${err.message}`)
    }
  }
}

function restore(win) {
  const file = getStoragePath(`state-${win.id}.json`)
  try {
    // synchronous read, to avoid flashing the window
    const state = JSON.parse(fs.readFileSync(file, 'utf8'))
    win.setBounds(state)
    if (state.isMaximized) {
      win.maximize()
    } else if (state.isMinimized) {
      win.minimize()
    } else {
      win.setFullScreen(state.isFullScreen)
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

function makePositionObservable(win) {
  return merge(
    fromEvent(win, 'minimize'),
    fromEvent(win, 'restore'),
    fromEvent(win, 'maximize'),
    fromEvent(win, 'unmaximize'),
    fromEvent(win, 'resize'),
    fromEvent(win, 'move')
  ).pipe(
    debounceTime(250),
    map(() => ({
      ...win.getBounds(),
      isMaximized: win.isMaximized(),
      isMinimized: win.isMinimized(),
      isFullScreen: win.isFullScreen()
    })),
    mergeMap(save(win))
  )
}

const subscriptions = new Map()

module.exports = {
  manageState(win) {
    restore(win)
    subscriptions.set(win.id, makePositionObservable(win).subscribe())
  },

  unmanageState(win) {
    const subscription = subscriptions.get(win.id)
    if (subscription) {
      subscription.unsubscribe()
    }
  },

  focusOnNotification(win) {
    if (win.isMinimized()) {
      win.restore()
    }
    win.focus()
  }
}
