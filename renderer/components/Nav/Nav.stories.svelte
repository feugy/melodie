<script>
  import faker from 'faker'
  import Nav from './Nav.svelte'
  import Heading from '../Heading/Heading.svelte'
  import { headingData } from '../Heading/Heading.stories'
  const paragraphs = Array.from({ length: 10 }, () => faker.lorem.paragraph())
</script>

<style>
  :global(body) {
    @apply p-0;
  }
</style>

<Nav {...$$props} />
<Heading {...headingData} />
<main class="text-left m-4 z-0 relative">
  {#each paragraphs as paragraph}
    <p class="py-2">{paragraph}</p>
  {/each}
</main>
