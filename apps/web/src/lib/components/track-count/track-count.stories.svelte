<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { tracksData } from '../tracks-table/tracks-table.testdata'
  import Component from './track-count.svelte'

  const { Story } = defineMeta({
    title: 'Components/TrackCount',
    component: Component,
    args: {
      tracks: tracksData,
    },
  })
</script>

<Story name="Default" />
<Story name="Single track" args={{ tracks: tracksData.slice(0, 1) }} />
<Story name="Empty" args={{ tracks: [] }} />
