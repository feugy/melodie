<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { fn } from '@storybook/test'
  import { tracksData } from '../tracks-table/tracks-table.testdata'
  import Component from './track-queue.svelte'

  const { Story } = defineMeta({
    title: 'Components/TrackQueue',
    component: Component,
    tags: ['autodocs'],
    args: { onmove: fn(), onplay: fn(), onremove: fn() },
  })
</script>

<Story
  name="With content"
  args={{
    tracks: [...tracksData, ...tracksData],
  }}
/>
