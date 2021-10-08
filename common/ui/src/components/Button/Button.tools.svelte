<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import Button from './Button.svelte'
</script>

<ToolBox name="Components/Button" component={Button} events={['click']}>
  <Tool name="Default" props={{ text: 'Default' }} />
  <Tool name="Primary" props={{ text: 'Primary', primary: true }} />
  <Tool
    name="Large text and icon"
    props={{ text: 'Hey!', icon: 'person', large: true }}
  />
  <Tool name="Text and icon" props={{ text: 'Hello', icon: 'face' }} />
  <Tool name="Primary icon" props={{ icon: 'volume_up', primary: true }} />
  <Tool name="Large icon" props={{ icon: 'play_arrow', large: true }} />
  <Tool name="With badge" props={{ text: 'Hello', icon: 'face', badge: 23 }} />
  <Tool
    name="With badge limit"
    props={{ text: 'Just too much', icon: 'warning', badge: 1000 }}
  />
  <Tool
    name="Primary with badge"
    props={{ text: 'Hello', icon: 'face', primary: true, badge: 5 }}
  />
</ToolBox>
