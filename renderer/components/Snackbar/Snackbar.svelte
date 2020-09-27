<script>
  import Portal from 'svelte-portal'
  import { onMount } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import Button from '../Button/Button.svelte'
  import { current } from '../../stores/snackbars'

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

<style type="postcss">
  div {
    @apply fixed flex flex-row items-center justify-center inset-x-0 w-full z-20;
    bottom: 120px;

    & > article {
      @apply px-4 py-2 shadow-lg rounded;
      background: var(--nav-bg-color);
      color: var(--hover-color);

      & > span {
        @apply py-2 inline-block;

        &:not(:last-child) {
          @apply mr-4;
        }
      }
    }
  }
</style>

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
