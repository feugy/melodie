<script>
  import { Tool } from '@atelier-wb/svelte'

  import HRefSink from '../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../atelier/utils'
  import Component from './artist.svelte'
  import { artistsData } from './artist.testdata'
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
