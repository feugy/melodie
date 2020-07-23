'use strict'

import { enableMapSet } from 'immer'
import App from './App.svelte'
import './common'

enableMapSet()

const app = new App({
  target: document.body,
  props: {}
})

export default app
