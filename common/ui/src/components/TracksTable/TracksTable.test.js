import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createClickToAddObservable } from '../../stores/track-queue'
import { sleep, translate } from '../../tests'
import TracksTable from './TracksTable.svelte'
import { current$Data, tracksData } from './TracksTable.testdata'

vi.mock('../../stores/track-queue')
vi.mock('../../stores/playlists')

describe('TracksTable component', () => {
  const clicks$ = {
    subscribe: () => ({ unsubscribe: vi.fn() }),
    next: vi.fn()
  }

  beforeEach(() => {
    location.hash = '#/'
    vi.resetAllMocks()
    createClickToAddObservable.mockReturnValue(clicks$)
  })

  it('has links to artists', async () => {
    const [id, artist] = faker.helpers.arrayElement(tracksData).artistRefs[0]
    render(
      html`<${TracksTable} tracks=${tracksData} current=${current$Data} />`
    )

    await userEvent.click(
      faker.helpers.arrayElement(screen.getAllByText(artist))
    )
    await sleep()

    expect(location.hash).toBe(`#/artist/${id}`)
  })

  it('has links to album', async () => {
    const [id, album] = faker.helpers.arrayElement(tracksData).albumRef
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    await userEvent.click(
      faker.helpers.arrayElement(screen.getAllByText(album))
    )
    await sleep()

    expect(location.hash).toBe(`#/album/${id}`)
  })

  it('proxies table clicks to click track-queue store', async () => {
    const track = faker.helpers.arrayElement(tracksData)
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    await userEvent.click(screen.getByText(track.tags.title))

    expect(clicks$.next).toHaveBeenCalledWith(track)
    expect(clicks$.next).toHaveBeenCalledOnce()
    expect(location.hash).toBe(`#/`)
  })

  it('opens track details dialogue from dropdown menu', async () => {
    const track = faker.helpers.arrayElement(tracksData)
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
    await userEvent.click(screen.getByText(translate('show details')))

    expect(screen.getByText(translate('track details'))).toBeVisible()
    expect(location.hash).toBe(`#/`)
  })
})
