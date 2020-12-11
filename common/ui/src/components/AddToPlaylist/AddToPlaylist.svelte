<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import CreatePlaylist from './CreatePlaylist.svelte'
  import SearchPlaylist from './SearchPlaylist.svelte'
  import { playlists, appendTracks, list } from '../../stores/playlists'

  export let tracks
  let options = []
  let allPlaylists = []
  let results = null
  let hasMany = false
  let open

  const limit = 5
  const createOption = { Component: CreatePlaylist, props: { onNameSet } }

  $: {
    if (!open) {
      results = null
    }
    if (hasMany) {
      options = [
        { Component: SearchPlaylist, props: { onSearchedSet } },
        ...(results
          ? results.slice(0, limit)
          : [
              {
                label: $_('_ playlists', { total: allPlaylists.length }),
                disabled: true
              }
            ]),
        createOption
      ]
      if (results && results.length > limit) {
        options.splice(-1, 0, {
          label: $_('_ more results', { value: results.length - limit }),
          disabled: true
        })
      } else if (results && results.length === 0) {
        options.splice(-1, 0, { label: $_('no results'), disabled: true })
      }
    } else {
      options = [...allPlaylists, createOption]
    }
  }

  onMount(() => {
    list()
    return playlists.subscribe(playlists => {
      allPlaylists = playlists.map(({ id, name }) => ({ label: name, id }))
      hasMany = allPlaylists.length > limit
    })
  })

  function onSearchedSet(searched) {
    if (!allPlaylists || !searched) {
      results = null
      return
    }
    results = allPlaylists.filter(
      ({ label }) => label && label.toLowerCase().includes(searched)
    )
  }

  function onNameSet(name) {
    if (name && name.trim().length > 0) {
      appendTracks({ name, tracks })
    }
  }
</script>

<Dropdown
  {...$$restProps}
  value={null}
  icon="library_add"
  withArrow={false}
  valueAsText={false}
  {options}
  bind:open
  on:close
  on:select
  on:select={({ detail: { id } }) => {
    if (id) {
      appendTracks({ id, tracks })
    }
  }} />
