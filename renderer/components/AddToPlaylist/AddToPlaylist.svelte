<script>
  import { onMount } from 'svelte'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import CreatePlaylist from './CreatePlaylist.svelte'
  import { playlists, appendTracks } from '../../stores/playlists'

  export let tracks
  let options = []

  onMount(() =>
    playlists.subscribe(playlists => {
      options = [
        {
          Component: CreatePlaylist,
          props: { onNameSet: name => appendTracks({ name, tracks }) }
        },
        ...playlists.map(({ id, name }) => ({ label: name, id }))
      ]
    })
  )
</script>

<Dropdown
  {...$$restProps}
  value={null}
  icon="library_add"
  withArrow={false}
  valueAsText={false}
  {options}
  on:select={({ detail: { id } }) => appendTracks({ id, tracks })} />
