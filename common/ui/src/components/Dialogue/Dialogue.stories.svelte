<script>
  import Dialogue from './Dialogue.svelte'
  import Button from '../Button/Button.svelte'
  import { texts } from '../../tests/lorem'

  export let open
</script>

<Dialogue {...$$restProps} bind:open on:close on:open>
  <div slot="content">
    Here is an important message, that you absolutely need to be aware of.
  </div>
  <span slot="buttons">
    <Button on:click={() => (open = false)} text={'Close'} icon={'close'} />
  </span>
</Dialogue>

<Button on:click={() => (open = true)} text={'Open'} />
<p>{texts.join('\n')}</p>
<p>{texts.join('\n')}</p>
<p>{texts.join('\n')}</p>
