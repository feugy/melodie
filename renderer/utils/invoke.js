'use strict'

// note: do not destructure, as it makes it harder to mock in Storybook
const electron = require('electron')

export async function invoke(invoked, ...args) {
  return electron.ipcRenderer.invoke('remote', ...invoked.split('.'), ...args)
}
