'use strict'

const { ipcRenderer } = require('electron')

export default async function (invoked, ...args) {
  return ipcRenderer.invoke('remote', ...invoked.split('.'), ...args)
}
