<script>
  import { Tool } from '@atelier-wb/svelte'

  import CircularProgress from './CircularProgress.svelte'
</script>

<Tool
  name="Components/Circular Progress"
  component={CircularProgress}
  props={{
    size: 60,
    percentage: 33
  }}
  layout="centered"
/>
