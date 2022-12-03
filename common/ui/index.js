'use strict'

import App from './src/App.svelte'
// order matters: App.svelte contains windi's reset rules, that we may override in common
import './src/common'
import { configureLogForward } from './src/utils'
import { init } from './src/stores/settings'

async function startApp() {
  const url = new URL(window.location)
  const port = url.searchParams.get('port')
  const serverUrl = port
    ? `ws://localhost:${port}`
    : `${window.location.protocol.replace('http', 'ws')}//${
        window.location.host
      }`
  configureLogForward()

  init(
    serverUrl,
    url.searchParams.get('totpSecret'),
    url.searchParams.get('totp')
  )

  window.addEventListener('error', err =>
    console.error('Uncaught error', { message: err.message, stack: err.stack })
  )
  window.addEventListener('unhandledrejection', event =>
    console.error('Unhandled rejection', { reason: event.reason })
  )

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
