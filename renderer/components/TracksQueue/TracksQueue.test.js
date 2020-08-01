'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import TracksQueue from './TracksQueue.svelte'
import { add, clear } from '../../stores/track-queue'

describe('TracksQueue component', () => {
  beforeEach(() => clear())

  it('allows duplicated tracks', async () => {
    const track1 = {
      id: 1,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    const track2 = {
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    add([track1, track2, track1])

    render(html`<${TracksQueue} />`)

    expect(screen.getAllByText(track1.tags.title)).toHaveLength(2)
    expect(screen.getAllByText(track2.tags.title)).toHaveLength(1)
  })
})
