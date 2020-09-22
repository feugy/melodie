'use strict'

const { shell } = require('electron')

function openExternalLinksInOSBrowser(event, url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    event.preventDefault()
    shell.openExternal(url)
  }
}

exports.configureExternalLinks = function (win) {
  win.webContents.on('will-navigate', openExternalLinksInOSBrowser)
}
