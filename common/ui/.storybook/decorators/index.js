'use strict'

import HRefSink from './HRefSink.svelte'

export const hrefSinkDecorator = story => ({
  Component: HRefSink,
  props: { ...story() }
})

export { default as ipcRendererMock } from './ipcRendererMock'
