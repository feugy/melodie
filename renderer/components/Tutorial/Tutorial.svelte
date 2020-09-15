<script>
  import { onMount, afterUpdate } from 'svelte'
  import { location } from 'svelte-spa-router'
  import { _ } from 'svelte-intl'
  import Annotation from '../Annotation/Annotation.svelte'
  import Button from '../Button/Button.svelte'
  import { handleNextButtonClick, current } from '../../stores/tutorial'

  let anchor
  let annotation
  const observer = new MutationObserver(updateAnchor)

  onMount(() => location.subscribe(updateAnchor))
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

{#if $current}
  <Annotation {anchor} {...annotation}>
    {@html $_($current.messageKey)}
    {#if $current.nextButtonKey}
      <Button
        class="mt-4"
        text={$_($current.nextButtonKey)}
        icon={$_($current.nextIcon || 'navigate_next')}
        on:click={handleNextButtonClick}
        primary="true" />
    {/if}
  </Annotation>
{/if}
