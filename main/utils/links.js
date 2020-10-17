'use strict'

const { shell } = require('electron')

/**
 * Prevent navigation and opens the targeted url with default browser, except if the link isn't
 * targetting a remote url.
 * @param {Event} event - navigation event
 * @param {string} url  - the url navigated to
 */
function openExternalLinksInOSBrowser(event, url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    event.preventDefault()
    shell.openExternal(url)
  }
}

/**
 * Configure an Electron browser window so it open links starting with http or https on the default
 * browser, instead of navigating the page
 *
 * @param {BrowserWindow} window - an Electron window
 */
exports.configureExternalLinks = function (window) {
  window.webContents.on('will-navigate', openExternalLinksInOSBrowser)
}
