<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import TextInput from './TextInput.svelte'
</script>

<ToolBox name="Components/TextInput" layout="padded">
  <Tool name="Default" let:props let:handleEvent>
    <span class="inline-block w-64">
      <TextInput
        on:iconClick
        {...props}
        on:iconClick={handleEvent}
        on:change={handleEvent}
      />
    </span>
  </Tool>

  <Tool
    name="With icon and placeholder"
    props={{ icon: 'i-mdi-magnify', type: 'search', placeholder: 'search...' }}
    let:props
    let:handleEvent
  >
    <span class="inline-block w-64">
      <TextInput
        on:iconClick
        {...props}
        on:iconClick={handleEvent}
        on:change={handleEvent}
      />
    </span>
  </Tool>

  <Tool
    name="With value"
    props={{ icon: 'i-mdi-account', value: 'hej!' }}
    let:props
    let:handleEvent
  >
    <span class="inline-block w-64">
      <TextInput
        on:iconClick
        {...props}
        on:iconClick={handleEvent}
        on:change={handleEvent}
      />
    </span>
  </Tool></ToolBox
>
