'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import albumRoute from './album.svelte'
import { albums as mockedAlbums, list } from '../stores/albums'
import { translate } from '../tests'

jest.mock('svelte-spa-router')
jest.mock('../stores/track-queue')
jest.mock('../stores/albums', () => ({
  albums: {},
  load: jest.fn(),
  list: jest.fn()
}))

describe('album route', () => {
  const albums = []

  beforeEach(() => {
    location.hash = '#/album'
    albums.splice(
      0,
      albums.length,
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
    const store = new BehaviorSubject(albums)
    mockedAlbums.subscribe = store.subscribe.bind(store)
    jest.resetAllMocks()
  })

  it('displays all albums', async () => {
    render(html`<${albumRoute} />`)

    expect(
      screen.getByText(translate('_ albums', { total: albums.length }))
    ).toBeInTheDocument()
    expect(screen.getByText(albums[0].name)).toBeInTheDocument()
    expect(screen.getByText(albums[1].name)).toBeInTheDocument()
    expect(list).not.toHaveBeenCalled()
  })
})
