<script>
  import { afterUpdate, onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { slide } from 'svelte/transition'
  import QRCode from 'qrcode'
  import Button from '../Button/Button.svelte'
  import CircularProgress from '../CircularProgress/CircularProgress.svelte'
  import { releaseWakeLock, stayAwake } from '../../utils'
  import { totp, period } from '../../stores/totp'
  import { showSnack } from '../../stores/snackbars'

  export let isBroadcasting
  export let address
  let open = false
  let closeTimer
  let codeCanvas
  let previous = null
  let remaining
  let remainingTimer

  $: fullAddress = `${address}?totp=${$totp}`

  $: if (address && codeCanvas) {
    QRCode.toCanvas(codeCanvas, fullAddress, {
      errorCorrectionLevel: 'Q',
      margin: 0.5,
      scale: 8
    })
  }

  onMount(() => {
    refreshRemaining()
    return () => clearTimeout(remainingTimer)
  })

  afterUpdate(() => {
    if (previous !== null && previous !== isBroadcasting) {
      open = isBroadcasting
    }
    if (open) {
      stayAwake()
    } else {
      releaseWakeLock()
    }
    previous = isBroadcasting
  })

  function refreshRemaining() {
    const now = Date.now()
    remaining = period - Math.floor((now / 1000) % period)
    remainingTimer = setTimeout(
      refreshRemaining,
      1000 - (now - Math.floor(now / 1000) * 1000) // refresh exactly on the next second
    )
  }

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

  async function handleClickTotp() {
    await navigator.clipboard.writeText($totp)
    showSnack({ message: $_('code copied') }, 3000)
  }
</script>

<style type="postcss">
  .button {
    @apply relative;
  }
  .menu {
    @apply absolute my-3 rounded z-20 text-sm p-4 whitespace-nowrap flex flex-col items-center;
    background-color: var(--bg-primary-color);
    border: 1px solid var(--outline-color);

    & > p {
      @apply mt-4;
    }
  }
  .totp {
    @apply flex text-4xl mt-1 cursor-pointer;
  }
  .remaining {
    @apply inline-block relative text-base ml-2;

    & > * {
      @apply absolute inset-x-0;
    }
    & > span {
      @apply top-2;
    }
  }
</style>

<span
  class="button"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <Button
    on:click
    icon={isBroadcasting ? 'wifi' : 'wifi_off'}
    noBorder={true}
  />
  {#if open}
    <div class="menu" role="menu" transition:slide>
      <a href={fullAddress}><canvas bind:this={codeCanvas} /></a>
      <p>{$_('scan or click the code to open Mélodie in your browser')}</p>
      <div class="totp" on:click|stopPropagation={handleClickTotp}>
        {$totp}
        <div class="remaining">
          <span>{remaining}</span>
          <CircularProgress size="40" percentage={(remaining * 100) / period} />
        </div>
      </div>
    </div>
  {/if}
</span>
