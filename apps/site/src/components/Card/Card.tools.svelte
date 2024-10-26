<script>
  import { Tool } from '@atelier-wb/svelte'

  import Card from './Card.svelte'
</script>

<Tool
  name="Site components/Card"
  props={{
    title: 'Portable',
    image: 'logos/os.png'
  }}
  layout="centered"
  let:props
>
  <Card {...props}>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </p>
  </Card>
</Tool>
