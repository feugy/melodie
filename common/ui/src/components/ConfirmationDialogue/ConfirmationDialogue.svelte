<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'

  import Button from '../Button/Button.svelte'
  import Dialogue from '../Dialogue/Dialogue.svelte'

  export let title
  export let open
  export let cancelText = 'no'
  export let confirmText = 'yes'
  export let cancelIcon = 'i-mdi-close-circle'
  export let confirmIcon = 'i-mdi-check'
  const dispatch = createEventDispatcher()
  let confirmed = false
</script>

<Dialogue
  {title}
  bind:open
  on:open={() => {
    confirmed = false
    dispatch('open')
  }}
  on:close={() => dispatch('close', confirmed)}
>
  <div slot="content" class="mb-4">
    <slot />
  </div>
  <span slot="buttons">
    <Button
      class="mr-2"
      on:click={() => (open = false)}
      text={$_(cancelText)}
      icon={cancelIcon}
    />
    <Button
      on:click={() => {
        confirmed = true
        open = false
      }}
      text={$_(confirmText)}
      icon={confirmIcon}
    />
  </span>
</Dialogue>
