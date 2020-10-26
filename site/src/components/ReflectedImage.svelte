<script>
  export let src
  export let height
</script>

<style type="postcss">
  img {
    height: var(--height);
  }

  div {
    @apply relative;

    &:after {
      @apply bg-no-repeat bg-cover absolute w-full mt-2 left-0;
      content: '';
      height: 20%;
      transform: rotateX(180deg);
      background-image: var(--src);
      background-position: left bottom;
      mask-image: linear-gradient(to bottom, transparent 25%, black 200%);
    }
  }
</style>

<div style="--height: {height}; --src:url('../{src}');">
  <img {...$$restProps} alt="" {src} />
</div>
