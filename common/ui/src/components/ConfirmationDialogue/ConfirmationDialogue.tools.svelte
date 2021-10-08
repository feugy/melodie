<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import ConfirmationDialogue from './ConfirmationDialogue.svelte'
</script>

<ToolBox
  name="Components/Confirmation dialogue"
  props={{ title: 'This is a title', open: true }}
>
  <Tool name="Default" let:props let:handleEvent>
    <ConfirmationDialogue
      {...props}
      on:close={handleEvent}
      on:open={handleEvent}
    >
      Are you really sure?
    </ConfirmationDialogue>
  </Tool>

  <Tool
    name="Custom action"
    props={{
      confirmIcon: 'redo',
      confirmText: `Yes, I'm sure!`,
      cancelIcon: 'undo',
      cancelText: 'No, let me go!'
    }}
    let:props
    let:handleEvent
  >
    <ConfirmationDialogue
      {...props}
      on:close={handleEvent}
      on:open={handleEvent}
    >
      Are you really sure?
    </ConfirmationDialogue>
  </Tool>
</ToolBox>
