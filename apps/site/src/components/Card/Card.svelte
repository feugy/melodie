<script>
  /** @type {string} */
  export let title
  /** @type {string|null} */
  export let image = null
</script>

<article>
  {#if image}<img src={image} alt="" />{/if}
  <div>
    <h4>{title}</h4>
    <p>
      <slot />
    </p>
  </div>
</article>

<style lang="postcss">
  article {
    --at-apply: rounded inline-flex flex-col text-left;
    background-color: #353849;
    width: 300px;

    & img {
      --at-apply: w-1/2 mx-auto mt-8;
    }

    & div {
      --at-apply: p-6;

      & h4 {
        --at-apply: mb-4;
      }

      & p {
        --at-apply: -mb-2;
      }
    }
  }
</style>
