'use strict'

import { get } from 'svelte/store'
import { push } from 'svelte-spa-router'
import { start, stop, current, handleNextButtonClick } from './tutorial'
import * as albums from './albums'
import * as playlists from './playlists'
import * as trackQueue from './track-queue'
import { mockInvoke, sleep } from '../tests'

describe('tutorial store', () => {
  beforeEach(() => {
    location.hash = `#/`
    jest.resetAllMocks()
  })

  it('is disabled by default, and allows navigation', async () => {
    expect(get(current)).toEqual(null)
    push('/search/test')
    await sleep(10)
    expect(location.hash).toEqual('#/search/test')
  })

  it('does nothing when stopping unstarted tutorial', async () => {
    expect(get(current)).toEqual(null)
    stop()
    push('/search/test')
    await sleep(10)
    expect(location.hash).toEqual('#/search/test')
  })

  it('starts on first step, and prevents navigation', async () => {
    start()
    await sleep()
    expect(get(current)).toEqual(
      expect.objectContaining({
        anchorId: 'locale',
        messageKey: 'tutorial.chooseLocale',
        nextButtonKey: 'alright'
      })
    )
    push('/search/test')
    await sleep(10)
    expect(location.hash).toEqual('#/')
  })

  it('goes to second step on click', async () => {
    handleNextButtonClick()
    await sleep()
    expect(get(current)).toEqual(
      expect.objectContaining({
        anchorId: 'folder',
        messageKey: 'tutorial.findMusic'
      })
    )
  })

  it('goes to third step when navigating to albums', async () => {
    push('/album')
    await sleep(10)
    expect(get(current)).toEqual(
      expect.objectContaining({
        messageKey: 'tutorial.awaitFirstAlbum'
      })
    )
  })

  it('goes to fourth step on first album retrieved', async () => {
    mockInvoke.mockResolvedValue({
      results: [{}],
      total: 1,
      size: 1,
      from: 0
    })
    albums.list()
    await sleep()
    expect(get(current)).toEqual(
      expect.objectContaining({
        anchorId: 'firstAlbum',
        messageKey: 'tutorial.playOrEnqueue',
        annotation: {
          top: '20%',
          left: '50%'
        }
      })
    )
  })

  it('goes to fifth step on enqueued tracks', async () => {
    trackQueue.add({})
    await sleep()
    expect(get(current)).toEqual(
      expect.objectContaining({
        anchorId: 'queue',
        messageKey: 'tutorial.makePlaylist',
        annotation: {
          left: '15%'
        }
      })
    )
  })

  it('goes to sixth step when creating a playlist', async () => {
    playlists.save({ name: 'my playlist', trackIds: [123456] })
    await sleep()
    expect(get(current)).toEqual(
      expect.objectContaining({
        anchorId: 'to-playlists',
        messageKey: 'tutorial.navigateToPlaylist',
        annotation: {
          top: '30%',
          left: '45%'
        }
      })
    )
  })

  it('goes to last step when navigating to playlists', async () => {
    push('/playlist')
    await sleep(10)
    expect(get(current)).toEqual(
      expect.objectContaining({
        messageKey: 'tutorial.end',
        nextButtonKey: `let's go`
      })
    )
  })

  it('stops on button click, and allows navigation', async () => {
    push('/search/test')
    await sleep(10)

    expect(location.hash).toEqual('#/playlist')
    handleNextButtonClick()
    await sleep()

    expect(get(current)).toEqual(null)
    push('/search/test')
    await sleep(10)

    expect(location.hash).toEqual('#/search/test')
  })

  it('can be started and stopped', async () => {
    start()
    await sleep()

    handleNextButtonClick()
    await sleep()

    expect(get(current)).toEqual(
      expect.objectContaining({
        anchorId: 'folder',
        messageKey: 'tutorial.findMusic'
      })
    )

    stop()
    // make sure tutorial is not awaiting
    push('/album')
    await sleep(10)

    expect(get(current)).toEqual(null)
    expect(location.hash).toEqual('#/album')
  })
})
