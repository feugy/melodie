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

  const intersectionObserver = new IntersectionObserver(entries => {
    for (const { isIntersecting, target: image } of entries) {
      if (isIntersecting) {
        let { src } = image.dataset
        delete image.dataset.src
        image.src = enhanceUrlWhenRequired(src) ?? ''
        intersectionObserver.unobserve(image)
      }
    }
  })
</script>

<script>
  import { onMount } from 'svelte'
  import { tokenUpdated } from '../../stores/settings'

  export let src
  export let rounded = false
  export let fallback = rounded ? 'person' : 'music_note'
  export let width = 256
  export let height = 256
  export let withNonce = false
  // exposed dimension
  export let dimension = null

  $: hidden = !src || broken.has(src)

  let imgElement

  onMount(() => {
    intersectionObserver.observe(imgElement)
    setSrc()
    const tokenSuscription = tokenUpdated.subscribe(setSrc)
    return () => {
      intersectionObserver.unobserve(imgElement)
      tokenSuscription.unsubscribe()
    }
  })

  function setSrc() {
    if (imgElement.hasAttribute('src')) {
      imgElement.src = encodeSrc(enhanceUrlWhenRequired(src), withNonce) ?? ''
    } else {
      imgElement.dataset.src = encodeSrc(src, withNonce)
    }
  }

  function handleError() {
    if (src) {
      broken.add(src)
    }
    src = null
  }

  function handleLoad() {
    dimension = { width: this.naturalWidth, height: this.naturalHeight }
  }
</script>

<style lang="postcss">
  img {
    @apply border-none;
    font-size: 0;
    object-fit: cover;
    background-color: var(--hover-bg-color);

    &:not(&[src]) {
      visibility: hidden;
    }
  }

  span {
    @apply inline-flex justify-center items-center;
    background-color: var(--hover-bg-color);
  }

  i {
    font-size: 200%;
  }
</style>

<img
  on:click
  on:error={handleError}
  on:load={handleLoad}
  {width}
  {height}
  bind:this={imgElement}
  {...$$restProps}
  class:rounded-full={rounded}
  class:rounded-sm={!rounded}
  class:hidden
  alt={src}
/>
{#if hidden}
  <span
    on:click
    class={$$restProps.class}
    class:rounded-full={rounded}
    class:rounded-sm={!rounded}
  >
    <i class="material-icons">{fallback}</i>
  </span>
{/if}
