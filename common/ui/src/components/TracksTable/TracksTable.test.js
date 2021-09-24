'use strict'

import { screen, render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import faker from 'faker'
import TracksTable from './TracksTable.svelte'
import { tracksData, current$Data } from './TracksTable.stories'
import { sleep, translate } from '../../tests'
import { createClickToAddObservable } from '../../stores/track-queue'

jest.mock('../../stores/track-queue')

describe('TracksTable component', () => {
  const clicks$ = {
    subscribe: () => ({ unsubscribe: jest.fn() }),
    next: jest.fn()
  }

  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    createClickToAddObservable.mockReturnValue(clicks$)
  })

  it('has links to artists', async () => {
    const [id, artist] = faker.random.arrayElement(tracksData).artistRefs[0]
    render(
      html`<${TracksTable} tracks=${tracksData} current=${current$Data} />`
    )

    userEvent.click(faker.random.arrayElement(screen.getAllByText(artist)))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${id}`)
  })

  it('has links to album', async () => {
    const [id, album] = faker.random.arrayElement(tracksData).albumRef
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    userEvent.click(faker.random.arrayElement(screen.getAllByText(album)))
    await sleep()

    expect(location.hash).toEqual(`#/album/${id}`)
  })

  it('proxies table clicks to click track-queue store', async () => {
    const track = faker.random.arrayElement(tracksData)
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    userEvent.click(screen.getByText(track.tags.title))

    expect(clicks$.next).toHaveBeenCalledWith(track)
    expect(clicks$.next).toHaveBeenCalledTimes(1)
    expect(location.hash).toEqual(`#/`)
  })

  it('opens track details dialogue from dropdown menu', async () => {
    const track = faker.random.arrayElement(tracksData)
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    await userEvent.click(
      screen.getByText(track.tags.title).closest('tr').querySelector('button')
    )
    await userEvent.click(screen.getByText('local_offer'))

    expect(screen.getByText(translate('track details'))).toBeVisible()
    expect(location.hash).toEqual(`#/`)
  })
})
