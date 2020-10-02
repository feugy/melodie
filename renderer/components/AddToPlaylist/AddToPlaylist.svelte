<script>
  import { onMount } from 'svelte'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import CreatePlaylist from './CreatePlaylist.svelte'
  import { playlists, appendTracks, list } from '../../stores/playlists'

  export let tracks
  let options = []

  onMount(() => {
    list()
    return playlists.subscribe(playlists => {
      options = [
        {
          Component: CreatePlaylist,
          props: {
            onNameSet: name => {
              if (name && name.trim().length > 0) {
                appendTracks({ name, tracks })
              }
            }
          }
        },
        ...playlists.map(({ id, name }) => ({ label: name, id }))
      ]
    })
  })
</script>

<Dropdown
  {...$$restProps}
  value={null}
  icon="library_add"
  withArrow={false}
  valueAsText={false}
  {options}
  on:select
  on:select={({ detail: { id } }) => {
    if (id) {
      appendTracks({ id, tracks })
    }
  }} />
