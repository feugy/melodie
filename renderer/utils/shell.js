'use strict'

const electron = require('electron')

export function openContainingFolder(track) {
  electron.shell.showItemInFolder(track.path)
}
