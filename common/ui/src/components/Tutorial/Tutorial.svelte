<script>
  import { afterUpdate, onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { location } from 'svelte-spa-router'

  import { current, handleNextButtonClick, stop } from '../../stores/tutorial'
  import Annotation from '../Annotation/Annotation.svelte'
  import Button from '../Button/Button.svelte'

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

{#if $current}
  <Annotation {anchor} {...annotation}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html $_($current.messageKey)}
    {#if $current.nextButtonKey}
      <Button
        class="mt-4"
        text={$_($current.nextButtonKey)}
        icon={$_($current.nextIcon || 'i-mdi-chevron-right')}
        on:click={handleNextButtonClick}
        primary="true"
      />
    {/if}
    <span class="skip">
      <Button
        text={$_('i will figure out')}
        icon="i-mdi-close"
        noBorder
        on:click={stop}
      />
    </span>
  </Annotation>
{/if}

<style>
  .skip {
    --at-apply: fixed;
    bottom: 100px;
    left: 100px;
  }
</style>
