<script>
  import { Tool } from '@atelier-wb/svelte'
  import BroadcastButton from './BroadcastButton.svelte'
  import { init } from '../../stores/totp'
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
