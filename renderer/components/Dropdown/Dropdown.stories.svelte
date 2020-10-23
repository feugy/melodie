<script>
  import Dropdown from './Dropdown.svelte'
  import { texts } from '../../tests/lorem'

  export let align = 'text-center'
  export let parentPosition = 'inherited'
  let value
</script>

<div>current value is: {(value && value.label) || value}</div>
<div class={align} style={`position: ${parentPosition}`}>
  <Dropdown bind:value {...$$props} on:select />
</div>
<p>{texts.join('\n')}</p>
<p>{texts.join('\n')}</p>
