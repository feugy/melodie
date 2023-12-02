import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { albums as mockedAlbums, list } from '../stores/albums'
import { makeRef, translate } from '../tests'
import albumRoute from './album.svelte'

vi.mock('svelte-spa-router')
vi.mock('../stores/albums')

describe('album route', () => {
  beforeEach(() => vi.resetAllMocks())

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
    expect(list).toHaveBeenCalled()
  })

  describe('given some albums', () => {
    const albums = []

    beforeEach(() => {
      location.hash = '#/album'
      albums.splice(
        0,
        albums.length,
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          refs: [faker.person.firstName(), faker.person.firstName()].map(
            makeRef
          )
        },
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          refs: [makeRef(faker.person.firstName())]
        }
      )
      const store = new BehaviorSubject(albums)
      mockedAlbums.subscribe = store.subscribe.bind(store)
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
})
