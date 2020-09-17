'use strict'

import App from './App.svelte'
import './common'

const electron = require('electron')

window.addEventListener('error', ({ error, message, filename, colno, lineo }) =>
  electron.ipcRenderer.send('error', { error, message, filename, colno, lineo })
)
window.addEventListener('unhandledrejection', ({ reason }) =>
  electron.ipcRenderer.send('error', reason)
)

const app = new App({
  target: document.body,
  props: {}
})

export default app
