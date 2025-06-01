<script module lang="ts">
  import type { LightArtist } from '$lib/types'
  import type { Agent } from '@melodie/common/models'
  import { addId, makeRef } from '@melodie/common/tests/refs'
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { fn } from '@storybook/test'
  import avatar from 'fixtures/avatar.jpg'
  import { http, HttpResponse } from 'msw'
  import Component from './artist.svelte'

  const id = 1
  const agentById = new Map<number, Agent>([[id, { id, name: '', base: '' }]])
  const artists: LightArtist[] = [
    {
      name: 'Foo Fighters',
      media: avatar,
      mediaCount: 1,
      agentId: id,
      bio: null,
      refs: ['Foo Fighters'].map(makeRef),
      trackIds: [],
    },
    {
      name: 'Ben Harper and The Innocent Criminals',
      media:
        'https://upload.wikimedia.org/wikipedia/commons/4/42/Ben_Harper_FIJM_2003.jpg',
      mediaCount: 1,
      agentId: id,
      bio: null,
      refs: ['Ben Harper and The Innocent Criminals'].map(makeRef),
      trackIds: [],
    },
    {
      name: 'Queen',
      media: null,
      mediaCount: 1,
      agentId: id,
      bio: null,
      refs: ['Queen'].map(makeRef),
      trackIds: [],
    },
  ].map(addId)

  const { Story } = defineMeta({
    title: 'Components/Artist',
    component: Component,
    args: {
      onplay: fn(),
      onenqueue: fn(),
    },
    parameters: {
      msw: {
        handlers: [
          http.get(
            'http://localhost/artists/:id/media/:count',
            ({ params: { id } }) => {
              const artist = artists.find((artist) => artist.id === Number(id))
              if (!artist?.media) {
                return new HttpResponse(null, { status: 404 })
              }
              return fetch(artist.media)
            }
          ),
        ],
      },
    },
  })
</script>

<Story name="Default" args={{ artist: artists[0], agentById }} />
<Story name="Truncated title" args={{ artist: artists[1], agentById }} />
<Story name="No avatar" args={{ artist: artists[2], agentById }} />
