'use strict'

import './tailwind.svelte'
import './common'
import App from './App.svelte'
import { initConnection, send } from './utils'
import { init } from './stores/settings'

async function startApp() {
  await initConnection(window.serverUrl)
  await init()

  window.addEventListener('error', send)
  window.addEventListener('unhandledrejection', ({ reason }) =>
    send({ error: reason })
  )

  return new App({
    target: document.body,
    props: {}
  })
}
startApp()
