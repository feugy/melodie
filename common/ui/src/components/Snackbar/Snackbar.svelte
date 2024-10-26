<script>
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import Portal from 'svelte-portal'

  import { current } from '../../stores/snackbars'
  import Button from '../Button/Button.svelte'

  let message = null
  let buttonText = null
  let handleButtonClick = null

  onMount(() =>
    current.subscribe(content => {
      message = null
      handleButtonClick = null
      buttonText = null
      if (content) {
        message = content.message
        if (content.button && typeof content.action === 'function') {
          handleButtonClick = content.action
          buttonText = content.button
        }
      }
    })
  )
</script>

<Portal>
  <div>
    {#if message}
      <article in:fly={{ y: 100 }} out:fade>
        <span>{message}</span>{#if handleButtonClick && buttonText}
          <Button noBorder text={buttonText} on:click={handleButtonClick} />
        {/if}
      </article>
    {/if}
  </div>
</Portal>

<style>
  div {
    --at-apply: fixed flex flex-row items-center justify-center inset-x-0 w-full
      z-20;
    bottom: 120px;

    & > article {
      --at-apply: px-4 py-2 shadow-lg rounded;
      background: var(--nav-bg-color);
      color: var(--hover-color);

      & > span {
        --at-apply: py-2 inline-block;

        &:not(:last-child) {
          --at-apply: mr-4;
        }
      }
    }
  }
</style>
