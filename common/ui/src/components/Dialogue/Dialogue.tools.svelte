<script>
  import { Tool } from '@atelier-wb/svelte'
  import Dialogue from './Dialogue.svelte'
  import Button from '../Button/Button.svelte'
</script>

<Tool
  name="Components/Dialogue"
  props={{ title: 'This is a title', open: true, noClose: false }}
  let:props
  let:handleEvent
>
  <Dialogue {...props} on:close={handleEvent} on:open={handleEvent}>
    <div slot="content">
      Here is an important message, that you absolutely need to be aware of.
    </div>
    <span slot="buttons">
      <Button
        on:click={() => (props.open = false)}
        text={'Close'}
        icon={'close'}
      />
    </span>
  </Dialogue>
</Tool>
