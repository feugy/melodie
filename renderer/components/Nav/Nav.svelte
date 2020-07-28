<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { push } from 'svelte-spa-router'
  import Button from '../Button/Button.svelte'

  let sentinel
  let floating = false

  onMount(() => {
    const observer = new IntersectionObserver(entries => {
      floating = !entries[0].isIntersecting
    })

    observer.observe(sentinel)
    return () => observer.unobserve(sentinel)
  })
</script>

<style type="postcss">
  .wrapper {
    @apply relative;
  }
  .sentinel {
    @apply block w-full h-0 relative;
    top: 4rem;
  }

  .floating {
    transition: background ease-in-out 200ms;
    background: rgba(0, 0, 0, 0.8);
  }

  nav {
    @apply p-2 fixed w-full;
    z-index: 1;
  }

  ul {
    @apply w-full flex flex-row items-center;
  }

  li {
    @apply mx-2;
  }

  .material-icons {
    @apply align-text-bottom;
  }

  h1 {
    @apply m-0 mr-2;
  }
</style>

<div class="wrapper">
  <span bind:this={sentinel} class="sentinel" />
  <nav class={$$props.class} class:floating>
    <ul>
      <li>
        <h1>{$_('Mélodie')}</h1>
      </li>
      <li>
        <Button
          on:click={() => push('/album')}
          text={$_('albums')}
          icon="album" />
      </li>
      <li />
    </ul>
  </nav>
</div>
