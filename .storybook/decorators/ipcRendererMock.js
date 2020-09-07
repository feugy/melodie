'use strict'

import { action } from '@storybook/addon-actions'

const invokeAction = action('invoke')

export default function (mock = () => null) {
  return storyFn => {
    if (!window.electron) {
      window.electron = {}
    }
    window.electron.ipcRenderer = {
      invoke: (channel, service, method, ...args) => {
        invokeAction(service, method, ...args)
        return mock(method, ...args) || {}
      }
    }
    return storyFn()
  }
}
