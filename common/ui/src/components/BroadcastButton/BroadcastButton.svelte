<script>
  import QRCode from 'qrcode'
  import { afterUpdate, onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { _ } from 'svelte-intl'

  import { showSnack } from '../../stores/snackbars'
  import { period, totp } from '../../stores/totp'
  import { releaseWakeLock, stayAwake } from '../../utils'
  import Button from '../Button/Button.svelte'
  import CircularProgress from '../CircularProgress/CircularProgress.svelte'

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

<span
  class="button"
  role="menu"
  tabindex="0"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <Button
    on:click
    icon={isBroadcasting ? 'i-mdi-wifi' : 'i-mdi-wifi-off'}
    noBorder={true}
    data-testid="broadcast-button"
  />
  {#if open}
    <div class="menu" role="menu" transition:slide>
      <a href={fullAddress}><canvas bind:this={codeCanvas} /></a>
      <p>{$_('scan or click the code to open Mélodie in your browser')}</p>
      <button class="totp" on:click|stopPropagation={handleClickTotp}>
        <i>{$totp.slice(0, 3)}</i><i>{$totp.slice(3)}</i>
        <div class="remaining">
          <CircularProgress size="40" percentage={(remaining * 100) / period} />
          <span>{remaining}</span>
        </div>
      </button>
    </div>
  {/if}
</span>

<style>
  .button {
    --at-apply: relative inline-block;
  }
  .menu {
    --at-apply: absolute my-3 rounded z-20 text-sm p-4 whitespace-nowrap flex
      flex-col items-center;
    background-color: var(--bg-primary-color);
    border: 1px solid var(--outline-color);

    & > p {
      --at-apply: mt-4;
    }
  }
  .totp {
    --at-apply: flex text-4xl mt-1 cursor-pointer;
    & > i {
      --at-apply: mr-2 not-italic;
    }
  }
  .remaining {
    --at-apply: inline-flex items-center justify-center relative text-base w-10
      ml-2 mt-2;

    & > *:not(span) {
      --at-apply: absolute inset-x-0;
    }
  }
</style>
