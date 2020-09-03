<script>
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import CreatePlaylist from './CreatePlaylist.svelte'
  import { playlists, appendTracks } from '../../stores/playlists'

  export let tracks

  $: options = [
    {
      Component: CreatePlaylist,
      props: { onNameSet: name => appendTracks({ name, tracks }) }
    },
    ...$playlists.map(({ id, name }) => ({ label: name, id }))
  ]
</script>

<Dropdown
  {...$$props}
  icon="library_add"
  withArrow={false}
  valueAsText={false}
  {options}
  on:select={({ detail: { id } }) => appendTracks({ id, tracks })} />
