<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Dialogue from '../Dialogue/Dialogue.svelte'

  export let title
  export let open
  export let cancelText = 'no'
  export let confirmText = 'yes'
  export let cancelIcon = 'cancel'
  export let confirmIcon = 'done'
  const dispatch = createEventDispatcher()
  let confirmed = false
</script>

<style lang="postcss">
  .content {
    @apply mb-4;
  }
</style>

<Dialogue
  {title}
  bind:open
  on:open={() => {
    confirmed = false
    dispatch('open')
  }}
  on:close={() => dispatch('close', confirmed)}
>
  <div slot="content" class="content">
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
