<script>
  import { recordEvent, Tool } from '@atelier-wb/svelte'

  import { mockWebsocket } from '../../atelier/utils'
  import { list } from '../../stores/playlists'
  import { isDesktop } from '../../stores/settings'
  import TrackDropdown from './TrackDropdown.svelte'

  export const playlistsData = [
    {
      id: 1,
      name: 'Awesome mix, vol. 1',
      trackIds: [10, 20]
    },
    {
      id: 2,
      name: 'Classical favourites',
      trackIds: [10, 30]
    },
    {
      id: 3,
      name: 'Awesome mix, vol. 2',
      trackIds: [40, 50]
    }
  ]
</script>

<Tool
  name="Components/Track Dropdown"
  props={{
    desktop: true,
    track: { id: 1, path: 'whatever' },
    additionalOptions: [
      {
        label: 'Custom item',
        icon: 'close',
        act: recordEvent('on custom item')
      }
    ]
  }}
  setup={async () => {
    await mockWebsocket(() => ({
      total: playlistsData.length,
      size: playlistsData.length,
      from: 0,
      results: playlistsData
    }))()
    list()
  }}
  layout="centered"
  let:props
  let:eventHandler
>
  {isDesktop.next(props.desktop) || ''}
  <TrackDropdown
    {...{ ...props, desktop: undefined }}
    on:showDetails={eventHandler}
  />
</Tool>
