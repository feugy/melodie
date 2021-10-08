'use strict'

import './common'
import App from './App.svelte'
import { send } from './utils'
import { init } from './stores/settings'

async function startApp() {
  await init(window.serverUrl)

  window.addEventListener('error', err => send(err, false))
  window.addEventListener('unhandledrejection', ({ reason }) =>
    send({ error: reason }, false)
  )
  const originalWarn = console.warn
  const originalError = console.error
  console.error = error => {
    send({ error }, false)
    originalError(error)
  }
  console.warn = warn => {
    send({ warn }, false)
    originalWarn(warn)
  }

  return new App({
    target: document.body,
    props: {}
  })
}
startApp()
