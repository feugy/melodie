<script>
  import Heading from './Heading.svelte'
  import { texts } from '../../tests/lorem'
</script>

<section>
  <Heading {...$$props} />
  <p>{texts.join('\n')}</p>
  <p>{texts.join('\n')}</p>
  <p>{texts.join('\n')}</p>
</section>
