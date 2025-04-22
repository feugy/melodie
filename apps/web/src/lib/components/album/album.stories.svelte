<script module lang="ts">
  import type { LightAlbum } from '$lib/types'
  import type { Agent } from '@melodie/common/models'
  import { addId, makeRef } from '@melodie/common/tests/refs'
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import cover from 'fixtures/cover.jpg'
  import { http, HttpResponse } from 'msw'
  import Component from './album.svelte'

  const id = 1
  const agentById = new Map<number, Agent>([[id, { id, name: '', base: '' }]])
  const albums: LightAlbum[] = [
    {
      name: 'Diamonds On The Inside',
      media: cover,
      mediaCount: 1,
      agentId: id,
      cover,
      refs: ['Ben Harper'].map(makeRef),
    },
    {
      name: 'A View From the Top of the World',
      media:
        'http://coverartarchive.org/release/50ba7d12-8b6f-48df-a483-aec366f75fef/30885069167-250.jpg',
      mediaCount: 1,
      agentId: id,
      refs: ['Dream Theater'].map(makeRef),
    },
    {
      name: 'Raiponse',
      media:
        'http://coverartarchive.org/release/631f7aa1-ec77-46ee-99f2-8ca2c8aa1cba/5383936782-250.jpg',
      mediaCount: 1,
      agentId: id,
      refs: [
        'Alan Menken',
        'Maeva Méline',
        'Sophie Delmas',
        'Michael Kosarin',
        'Michael Starobin',
      ].map(makeRef),
    },
    {
      name: 'A Change of Seasons',
      media: null,
      mediaCount: 1,
      agentId: id,
      refs: ['Dream Theater'].map(makeRef),
    },
    {
      name: 'A Night At The Opera',
      media: null,
      mediaCount: 1,
      agentId: id,
      refs: ['Queen'].map(makeRef),
    },
  ].map(addId)

  const { Story } = defineMeta({
    title: 'Components/Album',
    component: Component,
    parameters: {
      msw: {
        handlers: [
          http.get(
            'http://localhost/albums/:id/media/:count',
            ({ params: { id } }) => {
              const album = albums.find((album) => album.id === Number(id))
              if (!album?.media) {
                return new HttpResponse(null, { status: 404 })
              }
              return fetch(album.media)
            }
          ),
        ],
      },
    },
  })
</script>

<Story name="Default" args={{ album: albums[0], agentById }} />
<Story name="Truncated title" args={{ album: albums[1], agentById }} />
<Story name="Multiple artists" args={{ album: albums[2], agentById }} />
<Story name="No cover" args={{ album: albums[3], agentById }} />
<Story name="Broken cover" args={{ album: albums[4], agentById }} />
