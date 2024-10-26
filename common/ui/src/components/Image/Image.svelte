<script context="module">
  import { enhanceUrl } from '../../utils'

  export const broken = new Set()

  function encodeSrc(src, withNonce = false) {
    return src && !broken.has(src)
      ? withNonce
        ? addNonce(toDOMSrc(src))
        : toDOMSrc(src)
      : null
  }

  function toDOMSrc(path) {
    return path && path.replace(/#/g, '%23')
  }

  function enhanceUrlWhenRequired(src) {
    return src ? (src.startsWith('http') ? src : enhanceUrl(src)) : src
  }

  function addNonce(src) {
    return `${src}#nonce-${Math.random()}`
  }
</script>

<script>
  import { onMount } from 'svelte'

  import { tokenUpdated } from '../../stores/settings'

  export let src
  export let rounded = false
  export let icon = rounded ? 'i-mdi-account' : 'i-mdi-music-note'
  export let withNonce = false
  // exposed dimension
  export let dimension = null

  $: hidden = !src || broken.has(src)

  $: if (src) {
    setSrc()
  }

  let imgElement

  onMount(() => {
    setSrc()
    const tokenSuscription = tokenUpdated.subscribe(setSrc)
    return () => {
      tokenSuscription.unsubscribe()
    }
  })

  function setSrc() {
    if (imgElement) {
      imgElement.src = encodeSrc(enhanceUrlWhenRequired(src), withNonce) ?? ''
    }
  }

  function handleError(_, err) {
    if (src) {
      broken.add(src)
    }
    src = null
  }

  function handleLoad() {
    dimension = { width: this.naturalWidth, height: this.naturalHeight }
  }
</script>

<button
  on:click
  on:keydown
  on:keyup
  on:keypress
  class="flex justify-center items-center bg-[--hover-bg-color] overflow-hidden {$$restProps.class}"
  class:rounded-full={rounded}
  class:rounded-sm={!rounded}
>
  <img
    on:error={handleError}
    on:load={handleLoad}
    bind:this={imgElement}
    {...$$restProps}
    class:hidden
    loading="lazy"
    class="border-none font-size-0 object-cover w-full h-full"
    alt={src}
  />
  {#if hidden}
    <i data-testid={icon} class="icons inline-block font-size-[200%] {icon}" />
  {/if}
</button>
