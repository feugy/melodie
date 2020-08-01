<script>
  export let title
  export let image
  export let shadeColor = 'rgba(0, 0, 0, 0.7)'
</script>

<style type="postcss">
  header {
    @apply w-full px-8 pt-24 pb-40;
    margin-bottom: -9rem;
    background-image: linear-gradient(
        to top,
        var(--shade-color),
        var(--shade-color)
      ),
      var(--image);
    background-size: cover, 100% auto;
    background-position: center, center;
    clip-path: polygon(0% 0%, 100% 0%, 100% 45%, 0 100%);
  }

  h1 {
    @apply text-4xl font-semibold block text-left;
    border-bottom: solid 2px var(--outline-color);
  }
</style>

<header
  class={$$props.class}
  style="--image:url({image}); --shade-color:{shadeColor};">
  <h1>{title}</h1>
</header>
