'use strict'

import './tailwind.svelte'
import './common'
import App from './App.svelte'
import { send } from './utils'
import { init } from './stores/settings'

async function startApp() {
  await init(window.serverUrl)

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
