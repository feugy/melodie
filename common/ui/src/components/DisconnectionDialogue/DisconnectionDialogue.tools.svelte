<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import DisconnectionDialogue from './DisconnectionDialogue.svelte'
</script>

<ToolBox
  name="Components/Disconnection dialogue"
  component={DisconnectionDialogue}
  props={{ open: true, connecting: false }}
  events={['open', 'close', 'reconnect']}
>
  <Tool name="Default" />
</ToolBox>
