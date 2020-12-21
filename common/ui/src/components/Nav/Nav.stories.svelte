<script>
  import Nav from './Nav.svelte'
  import Heading from '../Heading/Heading.svelte'
  import { headingData } from '../Heading/Heading.stories'
  import { texts } from '../../tests/lorem'
</script>

<Nav {...$$props} />
<Heading {...headingData} />
<main class="text-left m-4 z-0 relative">
  {#each texts as text}
    <p class="py-2">{text}</p>
  {/each}
</main>
