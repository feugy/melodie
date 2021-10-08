<script>
  import { Tool } from '@atelier-wb/svelte'
  import Heading from './Heading.svelte'
  import { texts } from '../../tests/lorem'
</script>

<Tool
  name="Components/Heading"
  props={{
    title: '70 albums',
    image: './images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg'
  }}
  let:props
>
  <section>
    <Heading {...props} />
    <p>{texts.join('\n')}</p>
    <p>{texts.join('\n')}</p>
    <p>{texts.join('\n')}</p>
  </section>
</Tool>
