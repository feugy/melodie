<script>
  /** @type { string } */
  export let src
  /** @type {string} */
  export let height
</script>

<div style="--height: {height}; --src:url('{src}');">
  <img {...$$restProps} alt="" {src} />
</div>

<style>
  img {
    height: var(--height);
  }

  div {
    --at-apply: relative;

    &:after {
      --at-apply: bg-no-repeat bg-cover absolute w-full mt-2 left-0;
      content: '';
      height: 20%;
      transform: rotateX(180deg);
      background-image: var(--src);
      background-position: left bottom;
      mask-image: linear-gradient(to bottom, transparent 25%, black 200%);
    }
  }
</style>
