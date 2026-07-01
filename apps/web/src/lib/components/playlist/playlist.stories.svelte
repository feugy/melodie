<script module lang="ts">
  import type { LightPlaylist } from '$lib/types'
  import type { Agent } from '@melodie/common/models'
  import { addId } from '@melodie/common/tests/refs'
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { fn } from '@storybook/test'
  import Component from './playlist.svelte'

  const id = 1
  const agentById = new Map<number, Agent>([[id, { id, name: '', base: '' }]])
  const playlists: LightPlaylist[] = [
    {
      name: 'Morning focus',
      media: null,
      mediaCount: 1,
      agentId: id,
      refs: [],
      trackIds: [1, 2, 3, 4],
    },
    {
      name: 'Very long playlist name to check truncation behavior in grid cards',
      media: null,
      mediaCount: 1,
      agentId: id,
      refs: [],
      trackIds: [1],
    },
    {
      name: 'Empty playlist',
      media: null,
      mediaCount: 1,
      agentId: id,
      refs: [],
      trackIds: [],
    },
  ].map(addId)

  const { Story } = defineMeta({
    title: 'Components/Playlist',
    component: Component,
    args: {
      onplay: fn(),
      onenqueue: fn(),
    },
  })
</script>

<Story name="Default" args={{ playlist: playlists[0], agentById }} />
<Story name="Long title" args={{ playlist: playlists[1], agentById }} />
<Story name="Empty" args={{ playlist: playlists[2], agentById }} />
