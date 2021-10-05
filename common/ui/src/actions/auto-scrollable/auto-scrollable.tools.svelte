<script>
  import { Tool } from '@atelier-wb/svelte'
  import Scrollable from './auto-scrollable.test.svelte'
</script>

<Tool
  name="Actions/auto-scrollable"
  props={{
    borderDetection: 75,
    maxScroll: 30
  }}
  component={Scrollable}
/>
