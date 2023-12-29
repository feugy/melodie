<script>
  import { Tool } from '@atelier-wb/svelte'

  import { init } from '../../stores/totp'
  import BroadcastButton from './BroadcastButton.svelte'
</script>

<Tool
  name="Components/Broadcast button"
  setup={() => {
    init('abcdef')
  }}
  component={BroadcastButton}
  props={{
    isBroadcasting: false,
    address: 'http://192.168.0.10:8080'
  }}
  events={['click']}
  layout="padded"
/>
