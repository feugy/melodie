<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'

  import { isDesktop } from '../../stores/settings'
  import { add } from '../../stores/track-queue'
  import { invoke } from '../../utils'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import AddToPlaylist from './AddToPlaylist.svelte'

  export let track
  export let additionalOptions = []

  const dispatch = new createEventDispatcher()

  $: options = $isDesktop
    ? [
        ...additionalOptions,
        {
          label: $_('play now'),
          icon: 'i-mdi-play',
          act: () => add(track, true)
        },
        {
          label: $_('enqueue'),
          icon: 'i-mdi-playlist-plus',
          act: () => add(track)
        },
        {
          Component: AddToPlaylist,
          props: { track }
        },
        {
          label: $_('show details'),
          icon: 'i-mdi-tag',
          act: () => dispatch('showDetails', track)
        },
        {
          label: $_('open folder'),
          icon: 'i-mdi-launch',
          act: () => invoke('tracks.openContainingFolder', track.id)
        }
      ]
    : [
        ...additionalOptions,
        {
          label: $_('play now'),
          icon: 'i-mdi-play',
          act: () => add(track, true)
        },
        {
          label: $_('enqueue'),
          icon: 'i-mdi-playlist-plus',
          act: () => add(track)
        },
        {
          Component: AddToPlaylist,
          props: { track }
        },
        {
          label: $_('show details'),
          icon: 'i-mdi-tag',
          act: () => dispatch('showDetails', track)
        }
      ]
</script>

<Dropdown
  on:select={({ detail }) => detail.act && detail.act(track)}
  data-testid="track-dropdown"
  icon="i-mdi-dots-vertical"
  noBorder={true}
  withArrow={false}
  valueAsText={false}
  {options}
/>
