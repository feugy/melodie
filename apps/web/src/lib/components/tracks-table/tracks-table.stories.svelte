<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Component from './tracks-table.svelte'
  import { tracksData } from './tracks-table.testdata'

  const { Story } = defineMeta({
    title: 'Components/TracksTable',
    component: Component,
    args: { tracks: tracksData },
  })
</script>

<Story name="Default" />
<Story name="No Album" args={{ hideAlbum: true }} />
