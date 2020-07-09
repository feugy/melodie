'use strict'

const { ipcRenderer } = require('electron')

export async function invoke(invoked, ...args) {
  return ipcRenderer.invoke('remote', ...invoked.split('.'), ...args)
}
