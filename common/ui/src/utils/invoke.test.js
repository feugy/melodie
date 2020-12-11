'use strict'

import { get } from 'svelte/store'
import faker from 'faker'
import { invoke, lastInvokation } from './invoke'
import electron from 'electron'
import { sleep } from '../tests'

jest.mock('electron', () => ({
  ipcRenderer: {
    invoke: jest.fn()
  }
}))

describe('invoke', () => {
  beforeEach(jest.clearAllMocks)

  it('invokes relevant module', async () => {
    const result = faker.random.word()
    const arg1 = {
      lorem: faker.lorem.word()
    }
    const arg2 = faker.random.number()
    electron.ipcRenderer.invoke.mockResolvedValueOnce(result)
    expect(await invoke('dialog.showOpenDialog', arg1, arg2)).toEqual(result)
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledWith(
      'remote',
      'dialog',
      'showOpenDialog',
      arg1,
      arg2
    )
    expect(electron.ipcRenderer.invoke).toHaveBeenCalledTimes(1)
    await sleep()
    expect(get(lastInvokation)).toEqual({
      invoked: 'dialog.showOpenDialog',
      args: [arg1, arg2]
    })
  })
})
