'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { push } from 'svelte-spa-router'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import artistRoute from './artist.svelte'
import { artists as mockedArtists, load, list } from '../stores/artists'
import { add } from '../stores/track-queue'
import { translate } from '../tests'

jest.mock('svelte-spa-router')
jest.mock('../stores/track-queue')
jest.mock('../stores/artists', () => ({
  artists: {},
  load: jest.fn(),
  list: jest.fn()
}))

describe('artist route', () => {
  const artists = []

  beforeEach(() => {
    artists.splice(
      0,
      artists.length,
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar(),
        linked: [faker.name.findName(), faker.name.findName()]
      },
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar(),
        linked: [faker.name.findName()]
      }
    )
    const store = new BehaviorSubject(artists)
    mockedArtists.subscribe = store.subscribe.bind(store)
    jest.resetAllMocks()
  })

  it('displays all artists', async () => {
    render(html`<${artistRoute} />`)

    expect(
      screen.getByText(translate('_ artists', { total: artists.length }))
    ).toBeInTheDocument()
    expect(screen.getByText(artists[0].name)).toBeInTheDocument()
    expect(screen.getByText(artists[1].name)).toBeInTheDocument()
    expect(list).toHaveBeenCalled()
  })

  it('loads and play tracks of an artist', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      artist.tracks = tracks
      return artist
    })
    const artist = artists[0]

    render(html`<${artistRoute} />`)
    const play = screen
      .getByText(artist.name)
      .closest('article')
      .querySelector('[data-testid="play"]')
    await fireEvent.click(play)

    expect(load).toHaveBeenCalledWith(artist.id)
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(push).not.toHaveBeenCalled()
  })

  it('loads and enqueus tracks of an artist', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      artist.tracks = tracks
      return artist
    })
    const artist = artists[0]

    render(html`<${artistRoute} />`)
    const enqueue = screen
      .getByText(artist.name)
      .closest('article')
      .querySelector('[data-testid="enqueue"]')
    await fireEvent.click(enqueue)

    expect(load).toHaveBeenCalledWith(artist.id)
    expect(add).toHaveBeenCalledWith(tracks, false)
    expect(push).not.toHaveBeenCalled()
  })

  it('does not load tracks when already there', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    const artist = artists[0]
    artist.tracks = tracks

    render(html`<${artistRoute} />`)
    const play = screen
      .getByText(artist.name)
      .closest('article')
      .querySelector('button')
    await fireEvent.click(play)

    expect(load).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(push).not.toHaveBeenCalled()
  })

  it('navigates to artist details page', async () => {
    const artist = artists[1]

    render(html`<${artistRoute} />`)
    const album2 = screen.getByText(artist.name)
    await fireEvent.click(album2)

    expect(push).toHaveBeenCalledWith(`/artist/${artist.id}`)
    expect(load).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })
})
