'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import artistRoute from './artist.svelte'
import { artists as mockedArtists, list } from '../stores/artists'
import { translate, makeRef } from '../tests'

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
    location.hash = '#/artist'
    artists.splice(
      0,
      artists.length,
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar(),
        refs: [faker.name.findName(), faker.name.findName()].map(makeRef)
      },
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar(),
        refs: [makeRef(faker.name.findName())]
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
    expect(list).not.toHaveBeenCalled()
  })
})
