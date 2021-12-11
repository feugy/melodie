<script>
  export let title
  export let image = null
</script>

<style lang="postcss">
  article {
    @apply rounded inline-flex flex-col text-left;
    background-color: #353849;
    width: 300px;

    & img {
      @apply w-1/2 mx-auto mt-8;
    }

    & div {
      @apply p-6;

      & h4 {
        @apply mb-4;
      }

      & p {
        @apply -mb-2;
      }
    }
  }
</style>

<article>
  {#if image}<img src={image} alt="" />{/if}
  <div>
    <h4>{title}</h4>
    <p>
      <slot />
    </p>
  </div>
</article>
