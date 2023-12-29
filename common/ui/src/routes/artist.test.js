import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { artists as mockedArtists, list } from '../stores/artists'
import { makeRef, translate } from '../tests'
import artistRoute from './artist.svelte'

vi.mock('svelte-spa-router')
vi.mock('../stores/artists')

describe('artist route', () => {
  beforeEach(() => vi.resetAllMocks())

  it('handles no artists', async () => {
    const store = new BehaviorSubject([])
    mockedArtists.subscribe = store.subscribe.bind(store)

    render(html`<${artistRoute} />`)

    expect(
      screen.getByText(translate('_ artists', { total: 0 }))
    ).toBeInTheDocument()
    expect(
      screen.getByText(translate('check parameters').replace(/<.+>/, ''), {
        exact: false
      })
    ).toBeInTheDocument()
    expect(list).toHaveBeenCalled()
  })

  describe('given some artists', () => {
    const artists = []

    beforeEach(() => {
      location.hash = '#/artist'
      artists.splice(
        0,
        artists.length,
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
      const store = new BehaviorSubject(artists)
      mockedArtists.subscribe = store.subscribe.bind(store)
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
})
