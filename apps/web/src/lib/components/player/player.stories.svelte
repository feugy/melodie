<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { fn } from '@storybook/test'
  import cover from 'fixtures/cover.jpg'
  import webm from 'fixtures/file.webm'
  import Component from './player.svelte'

  const { Story } = defineMeta({
    title: 'Components/Player',
    component: Component,
    tags: ['autodocs'],
    args: { onnext: fn(), onprevious: fn() },
  })
</script>

<Story name="No file" />

<Story
  name="With track"
  args={{
    track: {
      data: webm,
      cover,
      artistRefs: [[123, 'Speaker']],
      albumRef: [1, null],
      tags: { artists: ['Speaker'], title: 'A webm presentation', genre: '' },
    },
  }}
/>
