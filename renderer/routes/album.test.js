'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import albumRoute from './album.svelte'
import { albums as mockedAlbums } from '../stores/albums'
import { translate, makeRef } from '../tests'

jest.mock('svelte-spa-router')
jest.mock('../stores/albums')

describe('album route', () => {
  it('handles no artists', async () => {
    const store = new BehaviorSubject([])
    mockedAlbums.subscribe = store.subscribe.bind(store)

    render(html`<${albumRoute} />`)

    expect(
      screen.getByText(translate('_ albums', { total: 0 }))
    ).toBeInTheDocument()
    expect(
      screen.getByText(translate('check parameters').replace(/<.+>/, ''), {
        exact: false
      })
    ).toBeInTheDocument()
  })

  describe('given some albums', () => {
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
          refs: [faker.name.findName(), faker.name.findName()].map(makeRef)
        },
        {
          id: faker.random.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          refs: [makeRef(faker.name.findName())]
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
    })
  })
})
