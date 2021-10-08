<script>
  import { Tool } from '@atelier-wb/svelte'
  import Component from './artist.svelte'
  import { artistsData } from './artist.testdata'
  import { mockWebsocket } from '../atelier/utils'
  import HRefSink from '../atelier/HRefSink.svelte'
</script>

<Tool
  name="Views/Artist"
  setup={mockWebsocket((invoked, artist, id) =>
    invoked === 'tracks.list'
      ? {
          size: 10,
          from: 0,
          total: artistsData.length,
          results: artistsData
        }
      : artistsData.find(artist => artist.id === id)
  )}
  let:props
>
  <HRefSink><Component {...props} /></HRefSink>
</Tool>
