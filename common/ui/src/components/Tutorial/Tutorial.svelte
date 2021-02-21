<script>
  import { onMount, afterUpdate } from 'svelte'
  import { location } from 'svelte-spa-router'
  import { _ } from 'svelte-intl'
  import Annotation from '../Annotation/Annotation.svelte'
  import Button from '../Button/Button.svelte'
  import { handleNextButtonClick, current, stop } from '../../stores/tutorial'

  let anchor
  let annotation
  const observer = new MutationObserver(updateAnchor)

  onMount(() =>
    location.subscribe(async () => {
      await new Promise(r => setTimeout(r, 0))
      updateAnchor()
    })
  )
  afterUpdate(updateAnchor)

  function updateAnchor() {
    observer.disconnect()
    if ($current) {
      annotation = {
        top: null,
        left: null,
        ...$current.annotation
      }
      anchor = document.getElementById($current.anchorId)
      if (anchor) {
        observer.observe(anchor.parentElement, { childList: true })
      }
    } else {
      anchor = null
    }
  }
</script>

<style type="postcss">
  .skip {
    @apply fixed;
    bottom: 100px;
    left: 100px;
  }
</style>

{#if $current}
  <Annotation {anchor} {...annotation}>
    {@html $_($current.messageKey)}
    {#if $current.nextButtonKey}
      <Button
        class="mt-4"
        text={$_($current.nextButtonKey)}
        icon={$_($current.nextIcon || 'navigate_next')}
        on:click={handleNextButtonClick}
        primary="true"
      />
    {/if}
    <span class="skip">
      <Button
        text={$_('i will figure out')}
        icon="close"
        noBorder
        on:click={stop}
      />
    </span>
  </Annotation>
{/if}
