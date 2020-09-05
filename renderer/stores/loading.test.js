'use strict'

import { isLoading } from './loading'
import * as albums from './albums'
import * as artists from './artists'
import * as playlists from './playlists'
import { mockIpcRenderer, mockInvoke, sleep } from '../tests'

describe('loading store', () => {
  let subscription
  let status

  beforeEach(() => {
    jest.resetAllMocks()
    status = undefined
    subscription = isLoading.subscribe(isLoading => {
      status = isLoading
    })
    mockIpcRenderer.emit('tracking')
  })

  afterEach(() => {
    subscription.unsubscribe()
  })

  it('is not loading by default', () => {
    expect(status).toBe(false)
  })

  it('is loading until at least one observable is', async () => {
    mockInvoke.mockImplementation(async (channel, service, method) => {
      await sleep(method !== 'listArtists' ? 10 : 100)
      return {
        total: 0,
        size: 10,
        from: 0,
        results: []
      }
    })
    expect(status).toBe(false)
    mockIpcRenderer.emit('tracking', null, { inProgress: true })
    // tracking started
    expect(status).toBe(true)
    albums.list()
    mockIpcRenderer.emit('tracking', null, { inProgress: false })
    await sleep(5)
    // albums started
    expect(status).toBe(true)
    artists.list()
    // albums and artists started
    await sleep(10)
    // artists started
    expect(status).toBe(true)
    playlists.list()
    // playlists and artists started
    await sleep(110)
    // all stoped
    expect(status).toBe(false)
  })
})
