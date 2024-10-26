<script>
  export let title
  export let image
  export let shadeColor = 'rgba(0, 0, 0, 0.7)'
  export let imagePosition = 'center'
</script>

<header
  class={$$restProps.class}
  style="--image:url({image}); --shade-color:{shadeColor}; --bgPosition:{imagePosition}"
>
  <h1>{title}</h1>
</header>

<style>
  header {
    --at-apply: w-full px-4 pt-16 pb-40 relative;
    z-index: -1;
    margin-bottom: -9rem;
    background-image: linear-gradient(
        to top,
        var(--shade-color),
        var(--shade-color)
      ),
      var(--image);
    background-size:
      cover,
      100% auto;
    background-position: center, var(--bgPosition);
    background-size: cover, cover;
    clip-path: polygon(0% 0%, 100% 0%, 100% 55%, 0 100%);
  }

  h1 {
    --at-apply: text-4xl font-semibold block text-left;
    border-bottom: solid 2px var(--outline-color);
  }
</style>
