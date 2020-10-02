<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import { add } from '../../stores/track-queue'
  import { openContainingFolder } from '../../utils'

  export let track
  export let additionalOptions = []

  const dispatch = new createEventDispatcher()

  $: options = [
    ...additionalOptions,
    { label: $_('play now'), icon: 'play_arrow', act: () => add(track, true) },
    { label: $_('enqueue'), icon: 'playlist_add', act: () => add(track) },
    {
      label: $_('show details'),
      icon: 'local_offer',
      act: () => dispatch('showDetails', track)
    },
    {
      label: $_('open folder'),
      icon: 'launch',
      act: () => openContainingFolder(track)
    }
  ]
</script>

<Dropdown
  on:select={({ detail }) => detail.act(track)}
  icon="more_vert"
  noBorder={true}
  withArrow={false}
  valueAsText={false}
  {options} />
