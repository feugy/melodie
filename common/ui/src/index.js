'use strict'

import './common'
import App from './App.svelte'
import { send } from './utils'
import { init } from './stores/settings'

async function startApp() {
  const url = new URL(window.location)
  const port = url.searchParams.get('port')
  const serverUrl = port
    ? `ws://localhost:${port}`
    : `${window.location.protocol.replace('http', 'ws')}//${
        window.location.host
      }`
  window.dlUrl = serverUrl.replace('ws', 'http')

  init(
    serverUrl,
    url.searchParams.get('totpSecret'),
    url.searchParams.get('totp')
  )

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

  // clean all parameters from url
  if (!/electron/i.test(navigator.userAgent)) {
    for (const [param] of url.searchParams) {
      url.searchParams.delete(param)
    }
    window.history.replaceState({}, document.title, url.toString())
  }

  return new App({
    target: document.body,
    props: {}
  })
}
startApp()
