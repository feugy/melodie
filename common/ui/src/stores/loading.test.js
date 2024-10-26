import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep } from '../tests'
import { invoke, serverEmitter } from '../utils'
import * as albums from './albums'
import * as artists from './artists'
import { isLoading } from './loading'
import * as playlists from './playlists'

describe('loading store', () => {
  let subscription
  let status

  beforeEach(() => {
    vi.resetAllMocks()
    status = undefined
    subscription = isLoading.subscribe(isLoading => {
      status = isLoading
    })
    serverEmitter.next({ event: 'tracking' })
  })

  afterEach(() => {
    subscription.unsubscribe()
  })

  it('is not loading by default', () => {
    expect(status).toBe(false)
  })

  it('is loading until at least one observable is', async () => {
    invoke.mockImplementation(async (invoked, type) => {
      await sleep(type !== 'artist' ? 10 : 100)
      return {
        total: 0,
        size: 10,
        from: 0,
        results: []
      }
    })
    expect(status).toBe(false)
    serverEmitter.next({ event: 'tracking', args: { inProgress: true } })
    // tracking started
    expect(status).toBe(true)
    albums.list()
    serverEmitter.next({ event: 'tracking', args: { inProgress: false } })
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
