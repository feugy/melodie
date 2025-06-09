<script module lang="ts">
  import type { Agent, Track as TrackModel } from '@melodie/common/models'
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { fn } from '@storybook/test'
  import cover from 'fixtures/cover.jpg'
  import webm from 'fixtures/file.webm'
  import { http } from 'msw'
  import BackgroundDecorator from '../../tests/background-decorator.svelte'
  import Component from './player.svelte'

  const id = 1
  const agentById = new Map<number, Agent>([[id, { id, name: '', base: '' }]])
  const { Story } = defineMeta({
    title: 'Components/Player',
    component: Component,
    args: { onnext: fn(), onprevious: fn(), onshuffle: fn() },
    parameters: {
      msw: {
        handlers: [
          http.get('http://localhost/tracks/:id/media/:count', () =>
            fetch(cover)
          ),
          http.get('tracks/:id/data', () => fetch(webm)),
        ],
      },
    },
    decorators: [
      (children) => ({
        // @ts-expect-error: how do we tell TS that we're returning the decorator instead of the story?
        Component: BackgroundDecorator,
        // @ts-expect-error: how do we tell TS that we're passing the decorator props?
        props: { color: 'preset-filled', children },
      }),
    ],
  })
</script>

<Story name="No file" args={{ agentById }} />

<Story
  name="Loading"
  args={{ agentById }}
  play={({ canvas }) => {
    const audio = canvas.getByTestId('audio-player')
    audio.dispatchEvent(new Event('loadstart', { bubbles: true }))
  }}
/>

<Story
  name="With track"
  args={{
    track: {
      id: 123,
      agentId: id,
      path: '',
      media: null,
      mediaCount: 1,
      artistRefs: [[123, 'Speaker']],
      albumRef: [1, null],
      tags: {
        artists: ['Speaker'],
        title: 'A webm presentation',
        genre: [''],
        duration: 125,
      },
      mtimeMs: 0,
    },
    agentById,
  }}
/>
