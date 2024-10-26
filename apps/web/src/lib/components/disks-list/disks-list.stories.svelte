<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Component from './disks-list.svelte'
  import { disksData } from './disks-list.testdata'

  const { Story } = defineMeta({
    title: 'Components/DiscksList',
    component: Component,
    tags: ['autodocs'],
    args: { tracks: disksData },
  })
</script>

<Story name="Default" />

<Story name="No Albums" args={{ hideAlbum: true }} />
