<script module lang="ts">
  import type { LightPlaylist } from '$lib/types'
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect, userEvent, within } from '@storybook/test'
  import { delay, http, HttpResponse } from 'msw'
  import Component from './add-to-playlist.svelte'

  const playlists: LightPlaylist[] = [
    {
      id: 101,
      name: 'Road trip',
      media: null,
      mediaCount: 0,
      refs: [],
      trackIds: [1, 2, 3],
    },
    {
      id: 202,
      name: 'Focus',
      media: null,
      mediaCount: 0,
      refs: [],
      trackIds: [4, 5],
    },
  ]

  const defaultHandlers = [
    http.get('*/api/playlists', () =>
      HttpResponse.json({ data: playlists, total: playlists.length })
    ),
    http.post('*/api/playlists/add-tracks', () =>
      HttpResponse.json({ added: 1, id: playlists[0].id })
    ),
  ]

  const { Story } = defineMeta({
    title: 'Components/AddToPlaylist',
    component: Component,
    args: {
      trackIds: [1, 2],
    },
    parameters: {
      msw: {
        handlers: defaultHandlers,
      },
    },
  })
</script>

<Story
  name="Default"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(await canvas.findByText('Road trip')).toBeInTheDocument()
  }}
/>

<Story
  name="Empty playlists"
  parameters={{
    msw: {
      handlers: [
        http.get('*/api/playlists', () =>
          HttpResponse.json({ data: [], total: 0 })
        ),
      ],
    },
  }}
/>

<Story
  name="Loading playlists"
  parameters={{
    msw: {
      handlers: [
        http.get('*/api/playlists', async () => {
          await delay(1500)
          return HttpResponse.json({ data: playlists, total: playlists.length })
        }),
      ],
    },
  }}
/>

<Story name="Disabled" args={{ trackIds: [] }} />
