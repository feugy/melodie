<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import Button from './Button.svelte'
</script>

<ToolBox
  name="Components/Button"
  component={Button}
  events={['click']}
  layout="padded"
>
  <Tool name="Default" props={{ text: 'Default' }} />
  <Tool name="Disabled" props={{ text: 'Disabled', disabled: true }} />
  <Tool name="Primary" props={{ text: 'Primary', primary: true }} />
  <Tool
    name="Primary disabled"
    props={{ text: 'Primary', primary: true, disabled: true }}
  />
  <Tool
    name="Large text and icon"
    props={{ text: 'Hey!', icon: 'i-mdi-account', large: true }}
  />
  <Tool name="Text and icon" props={{ text: 'Hello', icon: 'i-mdi-account' }} />
  <Tool
    name="Primary icon"
    props={{ icon: 'i-mdi-volume-plus', primary: true }}
  />
  <Tool name="Large icon" props={{ icon: 'i-mdi-play', large: true }} />
  <Tool
    name="With badge"
    props={{ text: 'Hello', icon: 'i-mdi-account', badge: 23 }}
  />
  <Tool
    name="With badge limit"
    props={{ text: 'Just too much', icon: 'i-mdi-alert', badge: 1000 }}
  />
  <Tool
    name="Primary with badge"
    props={{ text: 'Hello', icon: 'i-mdi-account', primary: true, badge: 5 }}
  />
</ToolBox>
