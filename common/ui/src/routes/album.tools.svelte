<script>
  import { Tool } from '@atelier-wb/svelte'

  import HRefSink from '../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../atelier/utils'
  import Component from './album.svelte'
  import { albumsData } from './album.testdata'
</script>

<Tool
  name="Views/Albums"
  setup={mockWebsocket((invoked, album, id) =>
    invoked === 'tracks.list'
      ? {
          size: 10,
          from: 0,
          total: albumsData.length,
          results: albumsData
        }
      : albumsData.find(album => album.id === id)
  )}
  let:props
>
  <HRefSink><Component {...props} /></HRefSink>
</Tool>
