<script>
  import { afterUpdate } from 'svelte'
  import { _ } from 'svelte-intl'
  import { slide } from 'svelte/transition'
  import Button from '../Button/Button.svelte'
  import QRCode from 'qrcode'

  export let isBroadcasting
  export let address
  let open = false
  let closeTimer
  let codeCanvas
  let previous = null

  $: if (address && codeCanvas) {
    QRCode.toCanvas(codeCanvas, address, {
      errorCorrectionLevel: 'Q',
      margin: 0.5,
      scale: 8
    })
  }

  afterUpdate(() => {
    if (previous !== null && previous !== isBroadcasting) {
      open = isBroadcasting
    }
    previous = isBroadcasting
  })

  function handleMouseEnter() {
    clearTimeout(closeTimer)
    if (isBroadcasting) {
      open = true
    }
  }

  function handleMouseLeave() {
    closeTimer = setTimeout(() => {
      open = false
    }, 100)
  }
</script>

<style type="postcss">
  .button {
    @apply relative;
  }
  .menu {
    @apply absolute my-3 right-0 rounded z-20 text-sm p-4 whitespace-no-wrap flex flex-col items-center;
    background-color: var(--bg-primary-color);
    border: 1px solid var(--outline-color);

    & > p {
      @apply mt-4;
    }
  }
</style>

<span
  class="button"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}>
  <Button
    on:click
    icon={isBroadcasting ? 'wifi' : 'wifi_off'}
    noBorder={true} />
  {#if open}
    <div class="menu" role="menu" transition:slide>
      <a href={address}><canvas bind:this={codeCanvas} /></a>
      <p>{$_('scan or click the code to open Mélodie in your browser')}</p>
    </div>
  {/if}
</span>
