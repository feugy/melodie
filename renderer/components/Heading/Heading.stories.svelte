<script>
  import Heading from './Heading.svelte'
  import { Album } from '..'
  import { albumData } from '../Album/Album.stories'
</script>

<section>
  <Heading {...$$props} />
  <div class="flex flex-wrap justify-around">
    <Album class="p-4" src={albumData} />
    <Album class="p-4" src={albumData} />
    <Album class="p-4" src={albumData} />
  </div>
</section>
