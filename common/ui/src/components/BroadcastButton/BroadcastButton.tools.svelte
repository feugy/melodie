<script>
  import { Tool } from '@atelier-wb/svelte'
  import BroadcastButton from './BroadcastButton.svelte'
</script>

<Tool
  name="Components/Broadcast button"
  component={BroadcastButton}
  props={{
    isBroadcasting: false,
    address: 'http://192.168.0.10:8080'
  }}
  events={['click']}
/>
