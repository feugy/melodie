<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import AddToPlaylist from './AddToPlaylist.svelte'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import { add } from '../../stores/track-queue'
  import { isDesktop } from '../../stores/settings'
  import { invoke } from '../../utils'

  export let track
  export let additionalOptions = []

  const dispatch = new createEventDispatcher()

  $: options = $isDesktop
    ? [
        ...additionalOptions,
        {
          label: $_('play now'),
          icon: 'play_arrow',
          act: () => add(track, true)
        },
        { label: $_('enqueue'), icon: 'playlist_add', act: () => add(track) },
        {
          Component: AddToPlaylist,
          props: { track }
        },
        {
          label: $_('show details'),
          icon: 'local_offer',
          act: () => dispatch('showDetails', track)
        },
        {
          label: $_('open folder'),
          icon: 'launch',
          act: () => invoke('tracks.openContainingFolder', track.id)
        }
      ]
    : [
        ...additionalOptions,
        {
          label: $_('play now'),
          icon: 'play_arrow',
          act: () => add(track, true)
        },
        { label: $_('enqueue'), icon: 'playlist_add', act: () => add(track) },
        {
          Component: AddToPlaylist,
          props: { track }
        },
        {
          label: $_('show details'),
          icon: 'local_offer',
          act: () => dispatch('showDetails', track)
        }
      ]
</script>

<Dropdown
  on:select={({ detail }) => detail.act && detail.act(track)}
  icon="more_vert"
  noBorder={true}
  withArrow={false}
  valueAsText={false}
  {options}
/>
